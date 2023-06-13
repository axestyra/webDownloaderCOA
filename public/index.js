import FuzzySearch from 'fuzzy-search';
import { downloadAndZip } from '../downloadandzip';
import "./index.css";
const tempExample = document.getElementById('hintedCharacters')

// const parse = import('parse-apache-directory-index');
export const BASE_URL = "https://attorneyoffline.de/base/characters/"
const IGNORE_VALUES = new Set([
    "Name",
    "Last modified",
    "Size",
    "Description",
    "Parent Directory"
])
const crawl = async (url, currentDepth, maximumDepth) => {
    if (currentDepth > maximumDepth) {
        return
    }
    const response = await fetch(`${url}`)
    if (response.status === 404) {
        return
    }
    // Create a fake webpage
    const websiteDirectoryPage = await response.text()
    const tempPage = document.createElement("html");
    tempPage.innerHTML = websiteDirectoryPage;

    const tags = tempPage.getElementsByTagName('a')
    const validLinks = []
    for (const link of tags) {
        const aTagValue = link.getAttribute('href')
        if (IGNORE_VALUES.has(link.innerHTML)) {
            continue
        }
        
        const newUrl = url + aTagValue
        // Crawl all directories,
        if (aTagValue.endsWith('/')) {
            validLinks.push(...await crawl(newUrl, currentDepth+1, maximumDepth))
        } else {
            validLinks.push(newUrl)
        }   
    }
    return validLinks
}

const getAllCharacterNames = async () => {
    const response = await fetch(`${BASE_URL}`)
    if (response.status === 404) {
        return
    }

    // Create a fake webpage
    const websiteDirectoryPage = await response.text()
    const tempPage = document.createElement("html");
    tempPage.innerHTML = websiteDirectoryPage;

    const tags = tempPage.getElementsByTagName('a')
    const validLinks = []
    for (const link of tags) {
        const aTagValue = link.getAttribute('href')
        if (IGNORE_VALUES.has(link.innerHTML)) {
            continue
        }
        
        // Crawl all directories,
        if (aTagValue.endsWith('/')) {
            validLinks.push(decodeURI(aTagValue.slice(0,-1)))
        } 
        
    }
    return validLinks
}

const failureText = document.getElementById('downloadFeedback')
export const getCharacterUrls = async () => {
    failureText.innerHTML = ""
    const characterName = document.getElementById('characterNameInput').value
    if (window.sortedCharacters.length === 0) {
        failureText.innerHTML = "Please select a valid character name" 
        return
    } else if (!window.sortedCharacters.includes(characterName)) {
        failureText.innerHTML = "Please choose a valid name from the dropdown provided."
        return
    }
    // Disable button so cant click multiple times
    document.getElementById('downloadButton').disabled = true
    document.getElementById('buttonText').style.display = 'none'
    document.getElementById('buttonLoading').style.display = 'block';
    const validUrls = await crawl(`${BASE_URL}${characterName}/`, 0, 99)
    await downloadAndZip(characterName, validUrls);
    return
}
document.getElementById('downloadButton').onclick = getCharacterUrls

window.characters = []
const createCharactersForDropdown = async () => {
    const allCharacterNames = await getAllCharacterNames()
    const uniqueNames = new Set(allCharacterNames)

    window.characters = Array.from(uniqueNames)
    document.getElementById('loadingContainer').style.display = 'none'
    document.getElementById('searchCharacter').style.display = "block"
}

window.sortedCharacters = []
export const searchForCharacters = () => {
    const userInput = document.getElementById('characterNameInput').value
    const searcher = new FuzzySearch(window.characters)
    window.sortedCharacters = searcher.search(userInput)
    tempExample.innerHTML = ""
    document.getElementById('characterSearchResults').innerHTML = `${window.sortedCharacters.length} / ${window.characters.length}`
    if (window.sortedCharacters.length < 100) {
        window.sortedCharacters.forEach(character => {
            tempExample.innerHTML += `<option value="${character}"></option>`
        });
    } else if (window.sortedCharacters.length > 100){
        tempExample.innerHTML = "Too many characters like this! Filter better."
    } else if (window.sortedCharacters.length === 0) {
        tempExample.innerHTML = "We cant find any characters with that name."
    } 
}
document.getElementById('characterNameInput').oninput = searchForCharacters

createCharactersForDropdown()

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if(urlParams.has('char')) {
    const characterName = urlParams.get('char')
    document.getElementById('characterNameInput').value = characterName
    const validUrls = await crawl(`${BASE_URL}${characterName}/`, 0, 99)
    document.getElementById('downloadButton').disabled = true
    document.getElementById('buttonText').style.display = 'none'
    document.getElementById('buttonLoading').style.display = 'block';
    await downloadAndZip(characterName, validUrls);
}