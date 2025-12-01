'use strict';

define(function (require) {
    var Postmonger = require('postmonger');
    var connection = new Postmonger.Session();

    var payload = {};
    var authTokens = {};

    var eventDefinitionKey = null;
    var templateCode = null;
    var phoneFieldName = null;
    var parameterList = null;
    var whatsappAccount = null;

    $(window).ready(onRender);

    connection.on('initActivity', initialize);
    connection.on('requestedTokens', onGetTokens);
    connection.on('requestedEndpoints', onGetEndpoints);
    connection.on('requestedInteraction', requestedInteractionHandler);
    connection.on('clickedNext', save);

    /* [ Form Validate ] ================================================================== */

    $('.validate-form .input100').each(function () {
        $(this).focus(function () {
            hideValidate(this);
        });
    });

    function showValidate(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();
        $(thisAlert).removeClass('alert-validate');
    }

    function validate_field(input) {
        if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        }
        else {
            if ($(input).val().trim() == '' || $(input).val().trim() == 'conta de envio*') {
                return false;
            }
        }
    }

    function validate() {
        var input = $('.validate-input .input100');
        var check = true;
        for (var i = 0; i < input.length; i++) {
            if (validate_field(input[i]) == false) {
                showValidate(input[i]);
                check = false;
            }
        }
        return check;
    }

    /* ![ Form Validate ] ================================================================== */

    function onRender() {
        connection.trigger('ready');
        connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');
        connection.trigger('requestInteraction');

        $('#toggleActive').click(function (evt) {
            evt.preventDefault();

            if (validate()) {
                document.getElementById('templateCode').disabled = true;
                templateCode = $('#templateCode').val();

                document.getElementById('phoneFieldName').disabled = true;
                phoneFieldName = $('#phoneFieldName').val();

                document.getElementById('parameterList').disabled = true;
                parameterList = $('#parameterList').val();

                document.getElementById('whatsappAccount').disabled = true;
                whatsappAccount = $('#whatsappAccount').val();

                document.getElementById('toggleActive').disabled = true;
                document.getElementById('toggleActive').innerHTML = "Ativado";
            }
        });
    }

    function initialize(data) {
        if (data) {
            payload = data;
        }

        templateCode = payload['arguments'].templateCode;

        if (templateCode) {
            document.getElementById('templateCode').disabled = true;
            document.getElementById('templateCode').value = templateCode;

            document.getElementById('phoneFieldName').disabled = true;
            document.getElementById('phoneFieldName').value = templateCode;

            document.getElementById('parameterList').disabled = true;
            document.getElementById('parameterList').value = templateCode;

            document.getElementById('whatsappAccount').disabled = true;
            document.getElementById('whatsappAccount').value = templateCode;

            document.getElementById('toggleActive').disabled = true;
            document.getElementById('toggleActive').innerHTML = "Ativado";
        }
    }

    function onGetTokens(tokens) {
        // console.log(tokens);
        authTokens = tokens;
    }

    function onGetEndpoints(endpoints) {
        // console.log(endpoints);
    }

    function requestedInteractionHandler(settings) {
        try {
            eventDefinitionKey = settings.triggers[0].metaData.eventDefinitionKey;
            document.getElementById('select-entryevent-defkey').value = eventDefinitionKey;
        } catch (err) {
            console.error(err);
        }
    }

    function save() {
        var parameters = parameterList.split(';');
        parameters = parameters.map(parameterName => `{{Event.${eventDefinitionKey}.\"${parameterName}\"}}`);

        payload['arguments'].execute.inArguments = [{
            "tokens": authTokens,
            "templateName": templateCode,
            "contactIdentifier": "{{Contact.Key}}",
            "phoneNumber": `{{Event.${eventDefinitionKey}.\"${phoneFieldName}\"}}`,
            "parameters": parameters,
            "account": whatsappAccount
        }];

        payload['metaData'].isConfigured = true;

        // console.log('payload', JSON.stringify(payload));

        connection.trigger('updateActivity', payload);
    }
});