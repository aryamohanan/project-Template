This repo is template for our services and requires NodeJS 16.17.0 and Python3 for correct work of `rdkafka` library.

To init new service don't forget to fill:
- `.env` file (for local environment you could copy from `.env.local` example)
- `package.json` file
- `data-source.ts` file for DB connection or multiple connections
- replace everywhere template `<service-name>` with real new service name

File `__ormconfig.js` was renamed and deprecated, and will be removed in next update. DB connection was changed to 
DataSource way. Additional information about usages you can check in `TypeORM` documentation:
https://typeorm.io/data-source

Creating new DB Entity put it to `lib\etities\*` directories that depends on your DB connection

For clear code style `ESlint` and `prettier` are configured, so please use them before commit your project and minimize code
errors and warnings. For comfort usages was added script command so please check `package.json` and enjoy them.


# Create a new repository on the command line
 
touch README.md
git init
git add README.md
git commit -m "first commit"
git remote add origin https://github.com/c0ldlimit/vimcolors.git
git push -u origin master
