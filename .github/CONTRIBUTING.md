Thank you for being interested in making Call of Cthulhu 7th Edition for Foundry VTT better. We encourage everyone to help improve this project with new features, bug fixes, or performance improvements. Please take a little bit of your time to read this guide and follow the steps below to make this process faster and easier.

The goal of this document is to provide easy instructions to setup a development environment and provide clear contribution guidelines to encourage participation from more developers.

The act of submitting pull requests with your changes involves creating a local branch, publishing it, and submitting a pull request, which will generate a code review. Once the review is approved, the code will automatically be merged.

These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Any Questions?

If you have any questions about the contribution process or any questions about the system itself, please feel free to contact us on Discord, `#chaosium` in https://discord.gg/foundryvtt

## Found a Bug?

Please do a search through Issues before creating a bug report to ensure we do not have duplicates. Please make sure that it is actually a bug, and not intended behavior. An incorrect implementation should not count as intended behavior.

A good bug report will list and detail:

- Steps to reproduce;
- Any modules being used;
- Expected behavior;
- Provide screenshots, if possible and appropriate.

If you use the keyboard while following the steps, record the GIF with the [Keybinding Resolver](https://github.com/atom/keybinding-resolver) shown. You can use [this tool](https://www.cockos.com/licecap/) to record a GIF on macOS and Windows, and [this tool](https://github.com/colinkeenan/silentcast) or [this tool](https://github.com/GNOME/byzanz), on Linux.

The more detail on reproducing, the better! Bugs are hard to fix if we can not reproduce them.

## Missing a Feature?

...

## Translators Wanted!

We are always looking for translators, there is a lot to translate, and we can not do it all. If you see any translations missing for you language, Feel free to look in the corresponding `*.json` file in the `lang` folder. Comparing against the `en.json` is a good idea, for a baseline.

For the list of missing translations, see: [TRANSLATIONS](.github/TRANSLATIONS.md).

## Coding

### Requisites

#### Git

On Windows, grab an installer from here: https://git-scm.com/download/win and go with the default options (there will be a lot of option screens).

On Mac and Linux, it is pre-installed.

To check if Git is installed in your environment, open the shell or terminal of your choice and run:

`git --version`

If you are a new Git user, probably you will have to set it up with the following commands:

`git config --global user.name "YOUR_NAME"`

`git config --global user.email "YOUR_EMAIL"`

#### Node.js (14+)

Grab an installer for any operating system from here: https://nodejs.org/en/download/

Follow the installation steps and then make sure everything went right with:

`node -v` or `node --version`

## Setup

### Cloning the Repository

On the directory where you would like to pull your changes open the terminal or shell of your choice, run:

`git clone https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT.git`

This will create a local clone of the project repository.

When prompted, enter your Github credentials.

### Initial Setup

Preferably, open your brand new local repository in the Integrated Development Environment (IDE) of your choice. We recommend [Visual Studio Code](#Visual-Studio-Code).

Still in the terminal, install the project dependencies running: `npm install`

If `npm install` throws any errors you can try `npm install --legacy-peer-deps` or `npm install --force`

Don't mind possible warnings. They are part of any Node project.

To make things easier, edit the `fvtt.config.example.js` file, located at the root of your local repository. The `userDataPath` key is your User Data Directory from Foundry and can be found on the Configuration tab on the Setup screen.

Examples:

- `%localappdata%/FoundryVTT`
- `~/Library/Application Support/FoundryVTT`
- `/home/$USER/.local/share/FoundryVTT`

Then, rename this file to `fvtt.config.js`

And with this you can create a system build that will be sent directly to your Foundry folder by `npm run build` or `npm run watch`.

If you do not configure this file, all the builds will be built in the `build/` folder, on the root directory.

Run `npm run build-compendiums` and `npm run build-manuals` to generate the binary packs as they are not included in the repository.

Run `npm run build` to perform a one off compile/build.

Now everything is ready for you to make any changes or additions you want.

After renaming `fvtt.config.example.js` to `fvtt.config.js` consider running:

`git update-index --assume-unchanged fvtt.config.js`

This way Git does not assume the original file has been deleted from the repository.

## Running automated tests

In order to run tests and see if you didn't introduce breaking changes, download [secondary repository with e2e Quench tests](https://github.com/Miskatonic-Investigative-Society/coc7-system-tests) and follow setup instructions there.

### Contributing

The project structure is made as follows:

- `src/`: The source code for the system.
  - `core/`: Core system logic, base classes, and global hooks.
  - `features/`: Self-contained features like 'chase', 'combat', 'sanity', etc.
  - `shared/`: Reusable utilities, UI components, and helpers.
- `manuals/`: Source markdown files for the in-game documentation.
- `scripts/`: Build scripts for generating compendiums, manuals, and other assets.
- `templates/`: Handlebars templates for sheets and UI.
- `lang/`: Localization files.

While testing your changes within Foundry VTT, prefer running: `npm run watch`

This way, Webpack and other dependencies will know whenever you make any relevant code changes and will run the build process only when necessary.

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these `beginner` and `help-wanted` issues!

## IDE Configuration

### Visual Studio Code

Install [Visual Studio Code](https://code.visualstudio.com/download).

Install extension [standard.vscode-standard](https://marketplace.visualstudio.com/items?itemName=standard.vscode-standard).

Configure the extension Tick `Standard: Auto Fix On Save`.

Before committing your code run `npm run format`.
