# Contributing to CoC7-FoundryVTT

:+1::tada: First off, thanks for taking the time to contribute! :tada::+1:

The following is a set of guidelines for contributing to CoC7-FoundryVTT and its packages, which are hosted in the [CoC7-FoundryVTT](https://github.com/HavlockV/CoC7-FoundryVTT) on GitHub. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

#### Table of Contents

[Installation](#installation)
  * [Installing on Foundry](#installing-on-foundy)
  * [Installing for local development](#installing-for-local-development)

[How Can I Contribute?](#how-can-i-contribute)
  * [Reporting Bugs](#reporting-bugs)
  * [Suggesting Enhancements](#suggesting-enhancements)
  * [Suggesting Features](#suggesting-features)
  * [Translators Wanted!](#translators-wanted)
  * [Creating a Pull Request](#creating-a-pull-request)
  * [Your First Code Contribution](#your-first-code-contribution)

## Installation

### Installing on Foundry

There are 2 main ways to install in Foundry:

1. Search for Call of Cthuhlu and select this module

2. Install in foundry VTT from the Game Systems tab using the following manifest: <https://raw.githubusercontent.com/HavlockV/CoC7-FoundryVTT/master/system.json>

### Installing for local development

Copy and paste the contents of `CoCFoundry` after pulling from master. This should be placed in a `CoC7` folder inside 
FoundryVTT's `systems` folder. 

Start up FoundryVTT, and the system should be listed as installed. From here, you can create world
with this system and test your changes.


## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report.

Bug reports should be labelled [Bug] when an issue is created.

#### Before Submitting A Bug Report

Please do a search through Issues before creating a bug report to ensure we do not have duplicates.
Please make sure that it's actually a bug, and not intended behavior. An incorrect implementation should not 
count as intended behavior.

#### How Do I Submit A (Good) Bug Report?

A good bug report will list and detail:

- Steps to reproduce
- Any modules being used
- Expected behavior
- Provide screencaps or gifs if possible

If you use the keyboard while following the steps, **record the GIF with the [Keybinding Resolver](https://github.com/atom/keybinding-resolver) shown**. You can use [this tool](https://www.cockos.com/licecap/) to record GIFs on macOS and Windows, and [this tool](https://github.com/colinkeenan/silentcast) or [this tool](https://github.com/GNOME/byzanz) on Linux.

The more detail on reproducing the better! Bugs are hard to fix if we can't reproduce them.

### Suggesting Enhancements

Enhancements should be labelled [Enhancement] when an issue is created.

#### How Do I Submit A (Good) Enhancement Suggestion?

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible.

### Suggesting Features

Features should be labelled [Feature] when an issue is created.

#### How Do I Submit A (Good) Feature Suggestion?

* **Use a clear and descriptive title** for the issue to identify the suggestion.
* **Provide a step-by-step description of the suggested feature** in as many details as possible.
* **Add quotes of the system** if system changes are required (such as Pulp Cthulhu), not all maintainers are familiar with the systems

### Translators Wanted

We are always looking for translators, there's a lot to translate, and we can't do it all.
If you see any translations missing for you language, Feel free to look in the corresponding `*.json` file
in the `lang` folder.

Comparing against the `en.json` is a good idea, for a baseline. 


### Creating a Pull Request

Before creating a pull request, it is suggested you fork the repository, and work within your own repository. 
When you have a working branch, you would then create a pull request to merge your branch into the `develop` branch.

#### Writing a good Pull Request

* **Use a clear and descriptive title** for the issue being solved
* **Link the issue that the request solves**
* **Provide testing instructions** in as many details as possible
* **Describe what changes** have been made, with before and after behavior

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these `beginner` and `help-wanted` issues:

* [Beginner issues][beginner] - issues which should only require a few lines of code, and a test or two.
* [Help wanted issues][help-wanted] - issues which should be a bit more involved than `beginner` issues.
