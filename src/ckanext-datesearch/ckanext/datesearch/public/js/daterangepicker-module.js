this.ckan.module('daterangepicker-module', function ($, _) {
    return {
        initialize: function () {

            // Define a new jQuery function to parse parameters from URL
            $.urlParam = function(name) {
                var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
                if (results == null) { return null; } else { return decodeURIComponent(results[1]) || 0; }
            };

            // Pick out relevant parameters
            param_start = $.urlParam('ext_start_date');
            param_end = $.urlParam('ext_end_date');

            // Populate the datepicker and hidden fields
            if (param_start) {
                $('#datepicker #start').val(moment.utc(param_start).format("YYYY-MM-DD"));
                $('#ext_start_date').val(param_start);
            }
            if (param_end) {
                $('#datepicker #end').val(moment.utc(param_end).format("YYYY-MM-DD"));
                $('#ext_end_date').val(param_end);
            }

            // Add hidden <input> tags #ext_start_date and #ext_end_date, if they don't already exist.
            var form = $("#dataset-search");
            // CKAN 2.1
            if (!form.length) {
                form = $(".search-form");
            }
            if ($("#ext_start_date").length === 0) {
                $('<input type="hidden" id="ext_start_date" name="ext_start_date" />').appendTo(form);
            }
            if ($("#ext_end_date").length === 0) {
                $('<input type="hidden" id="ext_end_date" name="ext_end_date" />').appendTo(form);
            }

            // Add a date-range picker widget to the <input> with id #daterange
            $('#datepicker.input-daterange').datepicker({
                format: "yyyy-mm-dd",
                keyboardNavigation: false,
                autoclose: true
            }).on('changeDate', function (ev) {
                    // Bootstrap-daterangepicker calls this function after the user picks a start and end date.

                    // Format the start and end dates into strings in a date format that Solr understands.
                    var v = moment(ev.date);
                    var fs = 'YYYY-MM-DD';

                    switch (ev.target.name) {
                        case 'start':
                            // Set the value of the hidden <input id="ext_start_date"> to the chosen start date.
                            if (ev.date) {
                                $('#ext_start_date').val(v.format(fs));
                            } else {
                                $('#ext_start_date').val('');
                            }
                            break;
                        case 'end':
                            // Set the value of the hidden <input id="ext_end_date"> to the chosen end date.
                            if (ev.date) {
                                $('#ext_end_date').val(v.format(fs));
                            } else {
                                $('#ext_end_date').val('');
                            }
                            break;
                    }

                    // Submit the <form id="dataset-search">.
                    form.submit();
                });
        }
    }
});
