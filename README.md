# n8n-nodes-python

![n8n.io - Workflow Automation](https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-logo.png)

PythonFunction module - custom node for running python code on n8n.

> run python code on n8n

# Python Function

PythonFunction node is used to run custom Python snippets to transform data or to implement some custom functionality
that n8n does not support yet.

# Installation

## Using n8n-python Docker Image (Recommended)

This node is pre-installed in
the [n8n-python](https://github.com/naskio/docker-n8n-python) [docker image](https://hub.docker.com/r/naskio/n8n-python)
.

- Use `n8n-python:latest-debian` if you are planning to install heavy python packages such as `numpy` or `pandas`.
- Use `n8n-python:latest` for a more lightweight image.

> Example using [docker-compose.yml](https://github.com/naskio/docker-n8n-python/blob/main/demo/docker-compose-local.yml)

## Adding external packages

You can mount a `requirements.txt` file to the container to install additional packages.

You can use the [ExecuteCommand](https://n8n.io/integrations/n8n-nodes-base.executeCommand) node to
run `pip install -r requirements.txt`
and the [n8nTrigger](https://n8n.io/integrations/n8n-nodes-base.n8nTrigger) node to trigger it after each **restart**.

## Install Locally

### 1- Install Requirements

This node requires the following dependencies to be installed in your environment:

- Python 3.6 or higher
	```shell
	python3 --version # check output version
	```

- [python-fire](https://www.github.com/google/python-fire)
	```shell
	# install fire
	pip install fire
	```

### 2- Add n8n-nodes-python to your n8n instance

If you’re running either by installing it globally or via PM2, make sure that you install `n8n-nodes-python` inside n8n.
n8n will find the module and load it automatically.

If using docker, add the following line to your `Dockerfile`:

```shell
# Install n8n-nodes-python module
RUN cd /usr/local/lib/node_modules/n8n && npm install n8n-nodes-python
```

Read more about the installation process in
the [n8n documentation - Use the n8n-nodes-module in production](https://docs.n8n.io/nodes/creating-nodes/create-n8n-nodes-module.html#use-the-n8n-nodes-module-in-production)
.

# Usage

This node receives `ìtems` and should return a list of `items`.

Example:

```python3
new_items = []
for item in items:
		item['newField'] = 'newValue'
		new_items.append(item)
return new_items # should return a list
```

> The JSON attribute of each item is added and removed automatically.
> You can access the values directly without the `json` attribute.
> You don't need to put the item in a `json` attribute. it will be done automatically.

## Variable: items

the `items` variable is a list of items that are passed to the function. They are directly accessible in the function.

Example:

```python3
print(items)
# > list
return items
```

## Credentials: env_vars (optional)

You can specify environment variables to be used in the python code. The environment variables are accessible throw
the `env_vars` dict.

Example:

```python3
print(env_vars)
print(env_vars.get('MY_VAR','default_value'))
# > dict
```

## Logging to the browser console

it is possible to write to the browser console by writing to `stdout`

Example:

```
print('Hello World')
# or
import sys
sys.stdout.write('Hello World')
```

# Notes

- `stderr`is used for passing data between nodes.

	- if exit code is 0, the node will be executed successfully and `stderr` represents the JSON representation of the
		output of the node
	- if exit code is not 0, the node fails and `stderr` represents the error message


- The `json` attribute of each item is added and removed automatically. (you can access and return the items directly
	without the `json` attribute)

# Contribute

Pull requests are welcome! For any bug reports, please create an issue.

# License

[Apache 2.0 with Commons Clause](LICENSE.md)
