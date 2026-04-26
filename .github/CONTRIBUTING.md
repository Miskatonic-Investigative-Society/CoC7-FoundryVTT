Thank you for being interested in making Call of Cthulhu 7th Edition for Foundry VTT better. We encourage everyone to help improve this project with new features, bug fixes, or performance improvements. Please take a little bit of your time to read this guide and follow the steps bellow to make this process faster and easier.

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

For the list of missing translations, see: [TRANSLATIONS](https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT/blob/develop/.github/TRANSLATIONS.md).

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

Run `npm run init` to let the build system know where your FoundryVTT install is.

Run `npm run compendiums-build` to generate the binary packs as they are not included.

Run `npm run manuals-build` to generate the binary pack for the system documentation.

Run `npm run roll-requests-build` to generate the binary pack that containing the example roll requests.

And with this you can create a system build that will be sent directly to your Foundry folder by `npm run build` or `npm run watch`

Run `npm run build` to perform a one off compile/build.

Now everything is ready for you to make any changes or additions you want.

## Running automated tests
In order to run tests and see if you didn't introduce breaking changes, download [secondary repository with e2e Quench tests](https://github.com/Miskatonic-Investigative-Society/coc7-system-tests) and follow setup instructions there.

### Contributing

The project structure is made as follows:

- `coc7/`: The source code for the system
  - `apps/`: Core system logic
  - `hooks/`: Hook functions
  - `manual/`: Source for doc/ Markdown and in game Journal
  - `models/`: Data Models, Document classes, and Sheets
    - `active-effect/`: Active Effects
    - `actor/`: Actor
    - `chases/`: Chase specific class
    - `fields/`: Custom schema fields
    - `item/`: Item
  - `setup/`: Core system setup
  - `tours/`: Built in tours
- `compendiums/`: YAML compendium data
- `docs/`: Compiled manual viewable on GitHub
- `scripts/`: Build scripts, run these via npm run commands configured in packages.json
- `static/`: Static files
  - `assets/`: Images for system
  - `lang/`: Localization files
  - `lib/`: Third party libraries
  - `templates/`: Handlebars JS template files
- `styles/`: Stylesheets

While testing your changes within Foundry VTT, prefer run: `npm run watch`

This way, Webpack and other dependencies will know whenever you make any relevant code changes and will run the build process only when necessary.

### Manual (coc7/manual/)
The in game Journal and Markdown in the docs/ folder are generated from the files in coc7/manual/ and are processed differently.

| Reason                                        | Pattern                                         | Example                                                              | In game Journal                                                   | Markdown                                 |
| --------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------| ---------------------------------------- |
| [Font Awesome](https://fontawesome.com/) Icon | ```/\[fa[^ ]+ fa-[^\]]+\]/```                   | ```[fa-solid fa-users]```                                            | ```<em class="fa-solid fa-users">&nbsp;</em>```                   |                                          |
| [Game Icons](https://game-icons.net/) Icon    | ```/\[game-icon game-icon-[[^\]]+\]/```         | ```[game-icon game-icon-tentacle-strike]```                          | ```<em class="game-icon game-icon-tentacle-strike">&nbsp;</em>``` |                                          |
| Prevent automatic in game link                | ```/@@coc7\./```                                | ```@@coc7.sanloss[sanMax:1D6,sanMin:1]```                            | ```<span>@</span>coc7.sanloss[sanMax:1D6,sanMin:1]```             | ```@coc7.sanloss[sanMax:1D6,sanMin:1]``` |
| In game link                                  | ```/@Compendium\[[^\]]+\.[^\\.]+\]{([^}]+)}/``` | ```@Compendium[CoC7.examples.JuI2aWDSEuQNKeUI]{Example Character}``` | ```<a class="content-link" ...>Example Character</a>```           | ```[_Example Character_]```              |

### Your First Code Contribution

Unsure where to begin contributing? You can start by looking through these `beginner` and `help-wanted` issues!

## IDE Configuration

### Visual Studio Code

Install [Visual Studio Code](https://code.visualstudio.com/download).

Install extension [dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)/

Before committing your code run `npm run eslint`
