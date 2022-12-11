### Lendsqr Backend Interview

Api for Lendsqr backend interview test written in node js + typescript.

## Prerequisites

- Node Js
- MySQL
- Paystack Account

## Setup Database Using Docker (Optional)

Provided you have `docker` and `docker compose` installed on your machine, you can follow the steps below to spin up a mysql database

- Update the key-value pairs under the field `environment` with your appropriate db credentials in the `docker-compose.yml` file
- Update `.env` file database values to be in sync with that of the values specified in the `docker-compose.yml` file
- Start a specific database `docker-compose -f ./docker-compose.yml up -d <service_name>` e.g `docker-compose -f ./docker-compose.yml up -d test_db`

## ERD (Entity Relational Diagram)

[ERD Documentation](https://sqlspy.io/import_db_designer/c3B5LTM2MTYzMzQtMjA5ODgwNjQ2M2IzMWExMC01ODUyNTM=)
![ER-Diagram](https://github.com/Oluwatunmise-olat/Lendsqr-Backend-Interview-Test/blob/master/resources/erd.png)

## Steps To Start App

- Clone the repo `git clone https://github.com/Oluwatunmise-olat/Lendsqr-Backend-Interview-Test.git`
- Navigate to repo directory `cd Lendsqr-Backend-Interview-Test`
- Create a `.env` file following the format as that in `env.example` file
- Install project dependencies `yarn install`
- Run migrations (Database should have been setup) `yarn run migrate`
- Start application `yarn run start:dev`

## Steps To Run Test

- Create a test database either by following the docker setup above or manually creating one
- Update the database credentials in the `.env` to match that of the created test database
- Run migrations `yarn run migrate`
- Run tests `yarn run test`

# Postman Documentation

[![Run in Postman](https://run.pstmn.io/button.svg)](https://documenter.getpostman.com/view/16498899/2s8YzTTMpt)

# Tools and Services Used

- Node Js
- Typescript
- MySql
- Knex
- Paystack
