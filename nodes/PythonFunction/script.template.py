import fire
import json


def snippet_runner(items: list, env_vars: dict = {}) -> list:
	# ...code snippet
	# should return items
	# <%- codeSnippet %>
	pass


def main(items: list, env_vars: dict = {}) -> None:
	new_items = snippet_runner(items, env_vars)
	assert type(new_items) is list or isinstance(new_items, list), "code snippet should return a list"
	print('```', json.dumps(new_items), '```')
	exit(0)


if __name__ == __main__:
	fire.Fire(main)

# python3 /py_scripts/io/io_fire.py --items='{{JSON.stringify($json)}}'  #$items()
