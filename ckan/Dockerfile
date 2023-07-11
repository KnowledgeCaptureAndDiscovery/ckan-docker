FROM ubuntu:22.04

# Setup

ENV SRC_DIR=/usr/src/ckan
ENV SRC_EXTENSIONS_DIR=/usr/src_extensions/ckan

ENV APP_DIR=/usr/lib/ckan/default/bin
ENV CKAN_INI=/etc/ckan/default/ckan.ini
ENV PIP_SRC=${SRC_DIR}
ENV CKAN_STORAGE_PATH=/home/ckan
ENV GIT_URL=https://github.com/ckan/ckan.git

# CKAN version to build
ENV GIT_BRANCH=master 

# Customize these on the .env file if needed
ENV CKAN_SITE_URL=http://localhost:5000
ENV CKAN__PLUGINS image_view text_view recline_view datastore datapusher envvars spatial_metadata spatial_query resource_proxy geo_view geojson_view shp_view wmts_view
ENV CKAN__VIEWS image_view datatables_view geo_view geojson_view shp_view wmts_view

# UWSGI options
ENV UWSGI_HARAKIRI=50

# ----
WORKDIR ${APP_DIR}

RUN apt update
RUN apt-get install -y python3-dev libpq-dev python3-pip python3-venv git-core redis-server

ENV VIRTUAL_ENV=/usr/lib/ckan/default

RUN mkdir -p $VIRTUAL_ENV 
RUN chown `whoami` $VIRTUAL_ENV 
RUN python3 -m venv $VIRTUAL_ENV

ENV OLDPATH="$PATH"
#ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN pip install --upgrade pip

RUN mkdir -p /etc/ckan/default
RUN chown -R `whoami` /etc/ckan/

# Packages
RUN apt-get install -y libmagic-dev
RUN apt-get install -y python-dev-is-python3 libxml2-dev libxslt1-dev libgeos-c1v5
RUN apt-get install -y uwsgi uwsgi-plugin-python3 curl

# Create SRC_DIR
RUN mkdir -p ${SRC_DIR} && \
# Install pip, supervisord and uwsgi
	curl -o ${SRC_DIR}/get-pip.py https://bootstrap.pypa.io/get-pip.py && \
	python3 ${SRC_DIR}/get-pip.py && \
	pip3 install supervisor && \
	mkdir /etc/supervisord.d && \
	rm -rf ${SRC_DIR}/get-pip.py

COPY setup/supervisord.conf /etc

# Install CKAN
RUN pip3 install -e git+${GIT_URL}@${GIT_BRANCH}#egg=ckan && \
    cd ${SRC_DIR}/ckan && \
    cp who.ini ${APP_DIR} && \
    pip3 install --no-binary markdown -r requirements.txt && \
    # Install CKAN envvars to support loading config from environment variables
    pip3 install -e git+https://github.com/okfn/ckanext-envvars.git#egg=ckanext-envvars && \
    # Create and update CKAN config
    ckan generate config ${CKAN_INI} && \
    ckan config-tool ${CKAN_INI} "beaker.session.secret = " && \
    ckan config-tool ${CKAN_INI} "ckan.views.default_views = ${CKAN__VIEWS}" && \
    ckan config-tool ${CKAN_INI} "ckan.plugins = ${CKAN__PLUGINS}"

# Convert configuration file from utf-8 to ascii (fixing some weird issues)
RUN cat /usr/src/ckan/ckan/ckan/config/config_declaration.yaml | iconv -f utf-8 -t ascii//TRANSLIT > /tmp/config_declaration.yaml
RUN cp /tmp/config_declaration.yaml /usr/src/ckan/ckan/ckan/config/config_declaration.yaml

# Install CKAN Spatial Extension
RUN pip install -e "git+https://github.com/ckan/ckanext-spatial.git#egg=ckanext-spatial" && \
	pip install -r /usr/src/ckan/ckanext-spatial/requirements.txt
RUN pip install -e "git+https://github.com/ckan/ckanext-geoview.git#egg=ckanext-geoview"
#RUN ckan config-tool ${CKAN_INI} "ckanext.spatial.search_backend = solr-bbox"
#RUN ckan config-tool ${CKAN_INI} -s "DEFAULT" -e "debug = true"

# Create a local user and group to run the app
RUN addgroup --gid 92 --system ckan && \
    adduser --uid 92 --home /home/ckan --shell /bin/bash --disabled-login --gid 92 ckan

# Create local storage folder
RUN mkdir -p ${CKAN_STORAGE_PATH} && \
    chown -R ckan:ckan ${CKAN_STORAGE_PATH} 

# Create folder for local extensions sources
RUN mkdir -p ${SRC_EXTENSIONS_DIR}

# Install packages needed by the dev requirements
RUN apt-get install -y libffi-dev
RUN apt-get install -y libxml2-dev libxslt-dev libffi-dev gcc musl-dev libgcc-11-dev libssl-dev curl
RUN DEBIAN_FRONTEND="noninteractive"  apt-get install -y libjpeg-dev zlib1g-dev libfreetype-dev liblcms2-dev libopenjp2-7-dev libtiff-dev tk-dev tcl-dev

# Install CKAN dev requirements
RUN pip3 install -r https://raw.githubusercontent.com/ckan/ckan/${GIT_BRANCH}/dev-requirements.txt

# Install CKAN Temporal Extension
# RUN pip install -e "git+https://github.com/EUDAT-B2FIND/ckanext-datesearch.git#egg=ckanext-datesearch"

COPY setup/prerun.py ${APP_DIR}
COPY setup/start_ckan.sh ${APP_DIR}
COPY setup/start_ckan_development.sh ${APP_DIR}

ADD https://raw.githubusercontent.com/ckan/ckan/${GIT_BRANCH}/wsgi.py ${APP_DIR}
RUN chmod 644 ${APP_DIR}/wsgi.py

# Create entrypoint directory for children image scripts
ONBUILD RUN mkdir /docker-entrypoint.d

EXPOSE 5000

HEALTHCHECK --interval=60s --timeout=5s --retries=5 CMD curl --fail http://localhost:5000/api/3/action/status_show || exit CMD ["/usr/lib/ckan/default/bin/start_ckan_development.sh"]

ENV PYTHONHOME=

#CMD ["/usr/lib/ckan/default/bin/start_ckan.sh"]
CMD ["/usr/lib/ckan/default/bin/start_ckan_development.sh"]
