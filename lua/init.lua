local M = {}

M.conversation_buf = nil
M.input_buf = nil
M.win_conversation = nil
M.win_input = nil
M.prev_buf = nil
M.server_job_id = nil

function M.start_server()
	if M.server_job_id and vim.fn.jobwait({ M.server_job_id }, 0)[1] == -1 then
		return
	end

	local job_id = vim.fn.jobstart({ "ts-node", vim.fn.expand("~/Workspace/alpha/src/Nvim.ts") }, {
		stdout_buffered = false,
		on_exit = function(_, code, _)
			print("Alpha server exited with code:", code)
			M.server_job_id = nil
		end,
		on_stdout = function(_, data, _)
			M.handle_response(data)
		end,
		on_stderr = function(_, data)
			M.handle_error_log(data)
		end,
	})

	M.server_job_id = job_id
	print("Alpha server started with job id:", job_id)
end

function M.toggle_ui()
	M.start_server()

	-- If already open, hide all windows and reset
	local any_open = false
	if M.win_conversation and vim.api.nvim_win_is_valid(M.win_conversation) then
		vim.api.nvim_win_close(M.win_conversation, true)
		M.win_conversation = nil
		any_open = true
	end
	if M.win_input and vim.api.nvim_win_is_valid(M.win_input) then
		vim.api.nvim_win_close(M.win_input, true)
		M.win_input = nil
		any_open = true
	end
	if any_open then
		M.prev_buf = nil
		return
	end

	-- Create or reuse buffers
	if not M.conversation_buf or not vim.api.nvim_buf_is_valid(M.conversation_buf) then
		M.conversation_buf = vim.api.nvim_create_buf(true, false)
		vim.api.nvim_buf_set_option(M.conversation_buf, "swapfile", false)
		vim.api.nvim_buf_set_option(M.conversation_buf, "buftype", "nofile")
		vim.api.nvim_buf_set_option(M.conversation_buf, "bufhidden", "hide")
		vim.api.nvim_buf_set_option(M.conversation_buf, "modifiable", false)
		vim.api.nvim_buf_set_name(M.conversation_buf, "alpha://Conversation")
		vim.api.nvim_buf_set_option(M.conversation_buf, "filetype", "markdown")
		vim.api.nvim_buf_set_option(M.conversation_buf, "modifiable", true)
		vim.api.nvim_buf_set_lines(M.conversation_buf, 0, -1, false, { "# Alpha is ready!", "" })
		vim.api.nvim_buf_set_option(M.conversation_buf, "modifiable", false)
		vim.api.nvim_buf_set_option(M.conversation_buf, "wrap", true)
	end
	if not M.input_buf or not vim.api.nvim_buf_is_valid(M.input_buf) then
		M.input_buf = vim.api.nvim_create_buf(true, false)
		vim.api.nvim_buf_set_option(M.input_buf, "swapfile", false)
		vim.api.nvim_buf_set_option(M.input_buf, "buftype", "nofile")
		vim.api.nvim_buf_set_option(M.input_buf, "bufhidden", "hide")
		vim.api.nvim_buf_set_option(M.input_buf, "modifiable", true)
		vim.api.nvim_buf_set_name(M.input_buf, "alpha://Input")
		vim.api.nvim_buf_set_option(M.input_buf, "filetype", "markdown")
		vim.api.nvim_buf_set_option(M.input_buf, "wrap", true)
	end

	-- Save the buffer you are replacing
	local cur_win = vim.api.nvim_get_current_win()
	vim.api.nvim_win_set_option(cur_win, "wrap", true)
	M.prev_buf = vim.api.nvim_win_get_buf(cur_win)

	-- Create vertical split on the right
	vim.cmd("vsplit")
	local right_win = vim.api.nvim_get_current_win()

	-- Set conversation buffer in the right split (top window)
	vim.api.nvim_win_set_buf(right_win, M.conversation_buf)
	M.win_conversation = right_win

	-- Split horizontally inside right window for input buffer (bottom window)
	vim.cmd("split")
	local input_win = vim.api.nvim_get_current_win()
	vim.api.nvim_win_set_buf(input_win, M.input_buf)
	M.win_input = input_win

	-- Resize input buffer to 10 lines
	vim.cmd("resize 10")

	-- Focus input buffer
	vim.api.nvim_set_current_win(M.win_input)

	-- Setup <CR> in input buffer to submit input
	vim.api.nvim_buf_set_keymap(
		M.input_buf,
		"n",
		"<CR>",
		":lua require'alpha'.submit_input()<CR>",
		{ noremap = true, silent = true }
	)
end

function M.submit_input()
	local input_lines = vim.api.nvim_buf_get_lines(M.input_buf, 0, -1, false)

	local input = table.concat(input_lines, "[ALPHA_INPUT_SEPERATOR]")
	if input == "" then
		return
	end

	-- Append input to conversation
	vim.api.nvim_buf_set_option(M.conversation_buf, "modifiable", true)
	table.insert(input_lines, 1, "## You:")
	vim.list_extend(input_lines, { "" })
	vim.api.nvim_buf_set_lines(M.conversation_buf, -1, -1, false, input_lines)
	vim.api.nvim_buf_set_option(M.conversation_buf, "modifiable", false)
	vim.api.nvim_buf_set_lines(M.input_buf, 0, -1, false, {})
	vim.fn.chansend(M.server_job_id, input .. "\n") -- Need \n because stream is line-based

	M.go_to_end_conversation()
end

function M.handle_response(data)
	if data then
		vim.schedule(function()
			vim.api.nvim_buf_set_option(M.conversation_buf, "modifiable", true)
			table.remove(data, #data)
			vim.api.nvim_buf_set_lines(M.conversation_buf, -1, -1, false, data)
			vim.api.nvim_buf_set_option(M.conversation_buf, "modifiable", false)

			M.go_to_end_conversation()
		end)
	end
end

function M.handle_error_log(data)
	if data then
		vim.schedule(function()
			local output = table.concat(data, "\n")
			local allowed_patterns = {
				"MCP Filesystem Server running on stdio",
				"Allowed directories:",
			}

			local allowed = false
			for _, pattern in ipairs(allowed_patterns) do
				if output:find(pattern) then
					allowed = true
					break
				end
			end

			if not allowed then
				vim.api.nvim_err_writeln("[Alpha RPC Error] " .. output)
			end
		end)
	end
end

function M.go_to_end_conversation()
	if M.win_conversation and M.conversation_buf then
		local line_count = vim.api.nvim_buf_line_count(M.conversation_buf)
		vim.api.nvim_win_set_cursor(M.win_conversation, { line_count, 0 })
	end
end

vim.keymap.set("n", "<Leader>,", M.toggle_ui, { noremap = true, silent = true })

return M
