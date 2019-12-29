const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const fsPromises = fs.promises;

async function distributeFile(filepath, sortedDir, shouldDelete) {
    try {
        const basename = path.basename(filepath),
            firstLetter = basename.charAt(0).toUpperCase(),
            newFileDir = path.join(sortedDir, firstLetter);

        if (!fs.existsSync(newFileDir)) {
            await fsPromises.mkdir(newFileDir);
        }

        const fileData = await fsPromises.readFile(filepath);

        const newFilepath = path.join(newFileDir, basename)
        await fsPromises.writeFile(newFilepath, fileData);

        return newFilepath;
    } catch (err) {
        console.log(err);
        return new Error(err);
    }
}

async function sortDirectory(dirname, sortedDir, shouldDelete) {
    try {
        const dirContent = await fsPromises.readdir(dirname);

        for (const file of dirContent) {
            const filepath = path.join(dirname, file);
            const fileStat = await fsPromises.lstat(filepath);

            if (fileStat.isDirectory()) {
                await sortDirectory(filepath, sortedDir, shouldDelete);
            } else {
                await distributeFile(filepath, sortedDir);

                shouldDelete && await fsPromises.unlink(filepath);
            }
        }

        shouldDelete && await fsPromises.rmdir(dirname);

        return 0;
    } catch (err) {
        return new Error(err);
    }
}

async function sort(messyDir, sortedDir, shouldDelete) {
    try {
        if (!fs.existsSync(sortedDir)) {
            await fsPromises.mkdir(sortedDir);
        } else {
            const sortedDirStat = await fsPromises.lstat(sortedDir);

            if (!sortedDirStat.isDirectory()) {
                throw new Error(`${sortedDir} не директория`)
            }
        }

        const messyDirStat = await fsPromises.lstat(messyDir);

        if (!messyDirStat.isDirectory()) {
            throw new Error(`${messyDir} не директория`)
        }

        await sortDirectory(messyDir, sortedDir, shouldDelete);

        return 0;
    } catch (err) {
        return new Error(err);
    }
}



const argv = yargs
    .usage('Usage: $0 [option]')
    .help('help')
    .alias('help', 'h')
    .version('1.0.0')
    .alias('version', 'v')
    .example('$0 --entry 1 --src 2 --delete-origin 3')
    .option('entry', {
        alias: 'e',
        describe: 'Путь к папке с файлами',
        default: './musik'
    })
    .option('src', {
        alias: 's',
        describe: 'Путь, где будет итоговая папка',
        default: './album'
    })
    .option('delete-origin', {
        alias: 'd',
        describe: ' Удалить оригинальную папку с файлами',
        type: 'boolean',
        default: false
    })
    .epilog('Сортировка музыки по папкам')
    .argv

sort(argv.e, argv.s, argv.d)
    .then(() => console.log('Звершено!'))
    .catch(err => console.log(err));

