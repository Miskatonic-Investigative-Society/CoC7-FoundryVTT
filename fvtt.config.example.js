/**
 * Enter the path to the Foundry Data Folder on userDataPath
 * This can be found in the Foundry settings
 * Examples: %localappdata%/FoundryVTT
 *           ~/Library/Application Support/FoundryVTT
 *           /home/$USER/.local/share/FoundryVTT
 * Then rename this file to fvtt.config.js
 * And then you can create a system build that will be sent directly
 * to your Foundry folder by `npm run build` or `npm run watch`
 * See CONTRIBUTING.md, under .github/ directory for more details
 */

const developmentOptions = {
  systemFolderName: 'CoC7',
  userDataPath: 'PATH_TO_FOUNDRY_DATA_FOLDER_HERE'
}

export default developmentOptions
