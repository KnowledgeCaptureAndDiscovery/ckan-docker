import logging

import ckan.plugins as plugins
import ckan.plugins.toolkit as toolkit

log = logging.getLogger(__name__)


class DateSearchPlugin(plugins.SingletonPlugin):
    plugins.implements(plugins.IConfigurer)
    plugins.implements(plugins.IPackageController, inherit=True)

    def update_config(self, config):
        toolkit.add_template_directory(config, 'templates')
        toolkit.add_public_directory(config, 'public')
        toolkit.add_resource('public', 'ckanext-datesearch')

    def before_search(self, search_params):
        return self.before_dataset_search(search_params)

    def before_dataset_search(self, search_params):
        extras = search_params.get('extras')
        if not extras:
            # There are no extras in the search params, so do nothing.
            return search_params

        start_date = extras.get('ext_start_date')
        end_date = extras.get('ext_end_date')

        if not start_date and not end_date:
            # The user didn't select either a start and/or end date, so do nothing.
            return search_params

        if not start_date:
            start_date = '*'

        if not end_date:
            end_date = '*'

        # Add a date-range query with the selected start and/or end dates into the Solr facet queries.
        fq = search_params.get('fq', '')
        fq = '{fq} +extras_temporal_range:[{sd} TO {ed}]'.format(fq=fq, sd=start_date, ed=end_date)

        search_params['fq'] = fq

        return search_params
