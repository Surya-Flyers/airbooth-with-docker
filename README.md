## docker-compose build --no-cache

## docker-compose rebuild --no-cache

## docker-compose -f docker-compose.dev.yaml build

- build with no cache

## docker-compose up

- start the services

## docker-compose ps

- list the services

## docker ps

- list the containers

## stop services

- docker-compose stop

## docker-compose up --renew-anon-volumes , -V

- Recreate anonymous volumes instead of retrieving data from the previous containers.

https://www.youtube.com/watch?v=6p7lylJEjrU

# Steps to RUN the app :

- docker-compose build --no-cache - (first time only)
- docker-compose up

For Tourist (FE app) Visit - http://localhost:4006/
For Inspector (FE app) Visit - http://localhost:4007/

For Node backend https://127.0.0.1:3000/health-checkup

- step-1 : visit Inspector app
- step-2 : enter any name (ex: inspector-name-007 ) & click connect button
- step-3 : visit Tourist app
- step-4 : enter any name (ex: client-name-007 ) & click initiate call button
- step-5 : visit Inspector app & click on client 0 & give permissions
- step-6 : visit Tourist app & give permissions.
<!-- By now call be initiated & you can able to see video -->

# If any packages added to the project :

- Open Docker desktop application
- click on Containers, find Container named "airbooth" & delete everything
- click on images & delete everything related to airbooth
- click on volumes & delete everything related to airbooth
- go back to vs-code terminal & follow the "Steps to RUN the app" guidelines above
