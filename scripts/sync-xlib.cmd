@REM IMPLEMENT THIS IN BASH:   try https://github.com/shelljs/shelljs or https://github.com/dthree/cash
@rem reference docs of gcloud compute here: https://cloud.google.com/sdk/gcloud/reference/compute/


@Setlocal EnableDelayedExpansion
@echo = what this does =
@echo launcher of phantomjs.exe for dev/testing / verification of backend
@REM ################  START BATCH SCRIPT FRAMEWORK v1.2 #######################
@echo .

@echo .
@echo .
@echo ====================  ====================    ====================  
@echo ====================  START EXECUTING BATCH FILE: %0
@echo ====================  ====================    ====================  
@echo .
@echo .

@rem @echo off

@rem @echo ------------------------------------
@rem @echo SET UP ENVIRONMENT HELPERS
@rem @echo ------------------------------------

@rem get location of the batch file
set thisFile=%0
FOR /F %%I IN ("%0") DO SET thisDir=%%~dpI



@rem get date
FOR /F "TOKENS=1* DELIMS= " %%A IN ('DATE/T') DO SET CDATE=%%B
FOR /F "TOKENS=1,2 eol=/ DELIMS=/ " %%A IN ('DATE/T') DO SET mm=%%B
FOR /F "TOKENS=1,2 DELIMS=/ eol=/" %%A IN ('echo %CDATE%') DO SET dd=%%B
FOR /F "TOKENS=2,3 DELIMS=/ " %%A IN ('echo %CDATE%') DO SET yyyy=%%B
SET date=%yyyy%%mm%%dd%


SET hh=%TIME:~0,2%
SET min=%TIME:~3,2%
SET time=%hh%%min%


set previousDir=%CD%
pushd %thisDir%
@rem get cd without trailing /
set thisDir=%CD%

@rem get thisDirName (not full path)

    @setlocal enableextensions enabledelayedexpansion
    @rem echo off
    set startdir=%thisDir%
    set temp=%startdir%
    set thisDirName=
:loop
    if not "x%temp:~-1%"=="x\" (
        set thisDirName=!temp:~-1!!thisDirName!
        set temp=!temp:~0,-1!
        goto :loop
    )
    echo.startdir = %startdir%
    echo.thisDirName   = %thisDirName%
    endlocal && set thisDirName=%thisDirName%
	


if "%1" == "" (
set interactive=true
)
set scriptErr=0
goto startLogic

:error

@echo .
@echo *******************************************
@echo **************  ERROR SECTION!  *********
@echo *******************************************
@echo .
if "%errorlevel%" NEQ "0" set scriptErr=%errorlevel%
if "%scriptErr%" == "" set scriptErr=-999
@echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
@echo ERROR!!!!!!!! %scriptErr%  script aborting. !!!!!!!!!!!!!!!!!!!!!
@echo !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
pause
:eof
@rem @echo "SCRIPT COMPLETE!  check above for errors"
@popd
@REM @if "%interactive%" == "true" pause
@exit /b %scriptErr%

:startLogic

@REM ################  END  BATCH SCRIPT FRAMEWORK v1.2 #######################
@REM ################  END  BATCH SCRIPT FRAMEWORK v1.2 #######################
@REM ################  END  BATCH SCRIPT FRAMEWORK v1.2 #######################
@REM ################  END  BATCH SCRIPT FRAMEWORK v1.2 #######################
@REM ################  END  BATCH SCRIPT FRAMEWORK v1.2 #######################


@rem build and publish xlib

echo START

pushd ..\..\xlib
if NOT "%errorlevel%" == "0" goto error
cmd /C npm version patch
if NOT "%errorlevel%" == "0" goto error
cmd /C npm publish --tag next
if NOT "%errorlevel%" == "0" goto error
popd

pushd ..
if NOT "%errorlevel%" == "0" goto error
cmd /C npm install xlib@next
if NOT "%errorlevel%" == "0" goto error
cmd /C tsc
if NOT "%errorlevel%" == "0" goto error
popd


@echo .
@echo *******************************************
@echo **************  SCRIPT FINISHED!  now go to google cloud console and set the image as the active for the instance template....  can/should we automate that here too? *********
@echo *******************************************
@echo .
@rem ###################### EOF SECTION
if NOT "%errorlevel%" == "0" goto error
@if "%scriptErr%" NEQ "0" goto error
@goto eof

