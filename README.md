## REQUIREMENTS

- you need to have ffmpeg installed.
- you need nodejs ;)

<br>

## Instructions

videos will be stored inside output folder (you need to create the folder 1st).

If you want you can use the web interface from this other repo: 
https://github.com/sovereignrealm/rtsp-frontend-videos

1. You will need to create an .env.production  file:

```
REACT_APP_API_URL=yourdomainhere
REACT_APP_VIDEO_TOKEN=test
```

2. replace with your data.

3. Then install the dependencies using "npm i" and compile it using "npm run build".

4. Move the created build folder to the root of this project and rename it "frontend".

<br>

## PROJECT SETUP

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
