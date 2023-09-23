# Docker setup for Windows 10 and above versions

## Download and install docker from below

```
https://docs.docker.com/desktop/install/windows-install/

```

## Setup The Windows Subsystem for Linux (WSL)

```
https://learn.microsoft.com/en-us/windows/wsl/install-manual

```

### Download the Linux kernel update package

```
https://learn.microsoft.com/en-us/windows/wsl/install-manual

```

### Install your Linux distribution of choice

```
https://learn.microsoft.com/en-us/windows/wsl/install-manual

```

After completing the setup, please proceed with the following steps to crate docker images:

## Step 1:
Initiate the process by crafting a fresh Dockerfile within the project's root directory.

## Step 2:
In a similar vein, generate an additional file named .dockerignore. This file will serve as a place to specify files that should be omitted from the build process.

## Step 3:
If the objective is to create multiple Docker images for distinct projects using docker-compose, proceed to establish a new docker-compose.yml file.
