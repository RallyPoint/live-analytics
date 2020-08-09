FROM node:10.12.0-jessie

# FOLDER app / import module with ln
WORKDIR /usr/app
COPY . /usr/app
RUN yarn install --quiet
RUN yarn run build

EXPOSE 3000

CMD [ "./ci/run-prod.sh" ]
