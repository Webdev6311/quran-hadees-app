@echo off
echo Importing Juz data to MongoDB Atlas...

set MONGO_URI=mongodb+srv://salman1122:salman2211@ac-erjijbt-shard-00-00.ptvdtkq.mongodb.net/quran_data
set JSON_FILE=src\quranjson\source\audio\juzData.json

mongoimport --uri "%MONGO_URI%" --collection juz --file "%JSON_FILE%" --jsonArray --drop

if %ERRORLEVEL% EQU 0 (
    echo Successfully imported Juz data!
) else (
    echo Failed to import Juz data.
)

pause
