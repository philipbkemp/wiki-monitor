FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docs/ /usr/share/nginx/html

EXPOSE 9331

CMD ["nginx","-g","daemon off;"]