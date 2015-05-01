# RecipeApp

The intention of this app is to have a recipe database and a planning tool at the same time. A week in advance can be planned and a shopping list is created. Recipes show up on the corresponding days and number of persons are incorporated into the shopping list and recipes. In addition due to personal reasons the database supports three languages for the same ingredient (english, german and finnish).

## Features

- [x] Create, Edit and Delete Units
- [x] Create, Edit and Delete Ingredients
- [x] Create, Edit and Delete Recipes including linkage of Ingredients and Units
- [x] Fix TypeAHead function (only exact matches are found, no fuzzy search)
- [ ] Fix mobile navigation bar autohide
- [ ] Fix ingredients in recipes (dispayed as Object at the moment)
- [ ] Create, Edit and Delete Schedules
- [ ] Autofill (random) recipes to schedules
- [ ] Shopping list generation including checking if bought
- [ ] Add possibility to add items to shopping list (besides recipe ingredients)
- [x] Add cocking overview for each planned day
- [x] User Authentication via token in redis database including login and logout
- [x] User management (admin level)
- [ ] Add user registration for new user including email validation


## Installation (Ubuntu)

### NodeJS

Get the newest NVM (Node Version Manager), see also https://github.com/creationix/nvm :

```bash
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.25.0/install.sh | bash
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

Install MongoDB by using MongoDB repositories (does not work with 15.04):

```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
sudo apt-get update
sudo apt-get install mongodb-org
```

### Redis

Install Redis by compiling the newest version:

```bash
wget http://download.redis.io/releases/redis-3.0.0.tar.gz
tar -xzf redis-3.0.0.tar.gz
cd redis-3.0.0
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
To actually run it at startup run the following and execute the generated command in the shell:
```bash
pm2 startup ubuntu
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




