# RecipeApp

The intention of this app / website is to have a recipe database and a planning tool at the same time. I.e. a week in advance can be planned and a shopping list is created automatically. Recipes show up on the corresponding days and number of persons are incorporated into the shopping list and recipes. In addition due to personal reasons the database supports three languages for the same ingredient (english, german and finnish).

Demo (login requires activation of me, so please email before): https://www.rezept-planer.de

## Features

- [x] Create, Edit and Delete Units
- [x] Create, Edit and Delete Ingredients
- [x] Create, Edit and Delete Recipes including linkage of Ingredients and Units
- [x] Create, Edit and Delete Schedules
- [x] Shopping list generation including checking if bought
- [x] Possibility to add items to shopping list (besides recipe ingredients)
- [x] User Authentication via token in redis database including login and logout
- [x] User management (admin level)

## Todos / BUGs

- [ ] On recipe search: hide on screen keyboard as soon as scrolling is started
- [ ] Better usability with appropriate error messages (ie. in case of login-in before activation of account)
- [ ] Add possibility to add new ingredients directly in recipe creation process
- [ ] Add possibility to distinguish between user added ingredient (not public) and admin approved ingredients (public)
- [ ] Add user registration for new users including email validation
- [ ] Hide actionbar on back button (ie Android app)
- [ ] Case insensitive usernames
- [ ] Fix rotation of recipe images
- [ ] Fix print menu esp. on mobile and extend print button also to shopping list, schedules and print also a whole week of schedules incl. recipes
- [ ] Add user settings with default language, etc.

## Future Features / Thoughts

- [ ] Add possibility of default unit per ingredient (ie. gramm) and scondary units with factor calculation (ie. ml, kg, cup)
- [ ] Add shopping units per ingredient (ie. can) for improved shopping list
- [ ] Add possibility to order whole shopping basket online (ie. at REWE online)
- [ ] Add possibility to comment on recipes (public)
- [ ] Add possibility to make own remarks to recipes of other uthors (non-puplic)


## Installation (Ubuntu)

Clean installation of Ubuntu 14.04 LTS.

Additional packages required for further process are:

```bash
sudo apt-get install gcc g++ git make nginx libkrb5-dev imagemagick
```


### NodeJS

Get the newest NVM (Node Version Manager), see also https://github.com/creationix/nvm :

```bash
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.29.0/install.sh | bash
```

Install and activate latest NodeJS version:

```bash
nvm install stable
nvm use stable
nvm alias default stable
```

### MongoDB

#### Official Version

Get the newest MongoDB from the official Ubuntu repositories:

```bash
sudo apt-get update
sudo apt-get install mongodb
```

#### Manual (newest version)

Install MongoDB by using MongoDB repositories (does not work with 15.04), see https://docs.mongodb.org/master/tutorial/install-mongodb-on-ubuntu/ :

```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### Redis

Install Redis by compiling the newest version:

```bash
wget http://download.redis.io/releases/redis-3.0.5.tar.gz
tar -xzf redis-3.0.5.tar.gz
cd redis-3.0.5/deps
make hiredis lua jemalloc linenoise
cd ..
make
sudo make install
```

If you want to make it automatically run at startup run the following:

```bash
cd utils
sudo ./install_server.sh
```

### Installation recipeApp

Enter the home directory (or where ever you want to install it), create an folder and enter it:

```bash
cd
mkdir recipeApp
cd recipeApp
```

Clone the git repository:

```bash
git clone https://github.com/jansauerbrey/recipe-app.git .
```

Install required modules for NodeJS:

```bash
npm install
```

Run by using:
```bash
node recipeApp.js
```

#### Automated startup

For automated startup (service) I use pm2. To install it and make the NodeJS server start at boot time run the following:

```bash
npm install -g pm2
pm2 start recipeApp.js
```
To actually run it at startup, run the following and execute the generated command in the shell:
```bash
pm2 startup ubuntu
```

#### Nginx configuration

Example configuration for https config:

/etc/nginx/sites-available/default

```bash
server {
       listen         80;
       server_name    www.rezept-planer.de;
       return         301 https://$server_name$request_uri;
}


server {
    listen 443 ssl;

    server_name www.rezept-planer.de;

    client_max_body_size 8M;

        ssl on;
        ssl_certificate /etc/nginx/ssl/rezept-planer.de.pem;
        ssl_certificate_key /etc/nginx/ssl/rezept-planer.de.key;

        ssl_session_timeout 5m;

        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_ciphers "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA:ECDHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES256-GCM-SHA384:AES128-GCM-SHA256:AES256-SHA256:AES128-SHA256:AES256-SHA:AES128-SHA:DES-CBC3-SHA:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!MD5:!PSK:!RC4";
        ssl_prefer_server_ciphers on;

		# adjust according to your path
    root /home/jan/recipeApp/cordova-app/www;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

		# adjust according to your path
    location /upload/ {
        alias /home/jan/recipeApp/upload/;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

```



## License

The MIT License (MIT)

Copyright (c) 2015 Jan Sauerbrey

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.




