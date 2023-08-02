## REQUIREMENTS

- you need to have ffmpeg installed.
- you need nodejs ;)

<br>

## Instructions

videos will be stored inside output folder (you need to create the folder 1st).

If you want you can have a web interface by compiling frontend code and place it at the root of this project naming it "frontend".

<br>

## SETUP

<br>

### 0)


copy .env.sample content inside 2 files you need to create:

.env.development

.env.production

<br>

IMPORTANT: fill with your data

<br>

### 1)


install node dependencies

``
npm i
``

<br>

### 2)


to run on development environment:

``
npm run dev
``

to run on production environment:

``
npm start
``

to run using pm2:

``
pm2 start
``