'use strict';

define(function (require) {
    console.log("in the custom activity ");
    var Postmonger = require('postmonger');
    var connection = new Postmonger.Session();

    var payload = {};
    var authTokens = {};

    var eventDefinitionKey = null;
    var templateCode = null;
    var phoneFieldName = null;
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

        // Configurar handlers de parâmetros
        setupParameterHandlers();
        
        // Atualizar contador inicial
        updateParameterCount();

        $('#toggleActive').click(function (evt) {
            evt.preventDefault();

            if (validate()) {
                // Coletar valores
                templateCode = $('#templateCode').val();
                phoneFieldName = $('#phoneFieldName').val();
                whatsappAccount = $('#whatsappAccount').val();

                // Desabilitar campos
                $('#templateCode').prop('disabled', true);
                $('#phoneFieldName').prop('disabled', true);
                $('#whatsappAccount').prop('disabled', true);
                $('#headerField').prop('disabled', true);
                $('#footerField1').prop('disabled', true);
                $('#footerField2').prop('disabled', true);
                $('.param-key, .param-value').prop('disabled', true);

                // Desabilitar botões
                $('#toggleActive').prop('disabled', true).text('Ativado');
                $('#btnAddParameter').prop('disabled', true);
                $('.btn-remove-param').prop('disabled', true);
            }
        });
    }

    /* [ Parameter Handlers ] ================================================================== */
    
    function setupParameterHandlers() {
        // Adicionar novo par de parâmetros
        $('#btnAddParameter').on('click', function(evt) {
            evt.preventDefault();
            addParameterRow();
        });
        
        // Delegação de eventos para botões de remover
        $('#parametersContainer').on('click', '.btn-remove-param', function(evt) {
            evt.preventDefault();
            $(this).closest('.parameter-row').remove();
            updateRemoveButtons();
            updateParameterCount();
        });
        
        // Atualizar contador quando campos mudam
        $('#parametersContainer').on('input', '.param-key, .param-value', function() {
            updateParameterCount();
        });
    }

    function addParameterRow() {
        var newRow = $('<div class="parameter-row">' +
            '<div class="wrap-input100">' +
                '<input class="input100 param-key" type="text" placeholder="Chave">' +
                '<span class="focus-input100"></span>' +
            '</div>' +
            '<div class="wrap-input100">' +
                '<input class="input100 param-value" type="text" placeholder="Valor">' +
                '<span class="focus-input100"></span>' +
            '</div>' +
            '<button type="button" class="btn-remove-param">−</button>' +
        '</div>');
        
        $('#parametersContainer').append(newRow);
        updateRemoveButtons();
        updateParameterCount();
        
        // Focar no campo de chave do novo parâmetro
        newRow.find('.param-key').focus();
    }

    function updateRemoveButtons() {
        var rows = $('.parameter-row');
        if (rows.length <= 1) {
            rows.find('.btn-remove-param').hide();
        } else {
            rows.find('.btn-remove-param').show();
        }
    }

    function updateParameterCount() {
        var count = 0;
        $('.parameter-row').each(function() {
            var key = $(this).find('.param-key').val().trim();
            var value = $(this).find('.param-value').val().trim();
            if (key && value) {
                count++;
            }
        });
        $('.param-count').text('(' + count + ')');
    }

    function collectParameters() {
        var parameters = [];
        
        // 1. Adicionar header se preenchido (chave fixa: header_attachment)
        var headerField = $('#headerField').val().trim();
        if (headerField) {
            parameters.push({
                key: "header_attachment",
                value: headerField
            });
        }
        
        // 2. Adicionar parâmetros customizados (chaves dinâmicas)
        $('.parameter-row').each(function() {
            var key = $(this).find('.param-key').val().trim();
            var value = $(this).find('.param-value').val().trim();
            if (key && value) {
                parameters.push({
                    key: key,
                    value: value
                });
            }
        });
        
        // 3. Adicionar footer 1 se preenchido (chave fixa: button_param_0)
        var footerField1 = $('#footerField1').val().trim();
        if (footerField1) {
            parameters.push({
                key: "button_param_0",
                value: footerField1
            });
        }
        
        // 4. Adicionar footer 2 se preenchido (chave fixa: button_param_1)
        var footerField2 = $('#footerField2').val().trim();
        if (footerField2) {
            parameters.push({
                key: "button_param_1",
                value: footerField2
            });
        }
        
        return parameters;
    }

    /* ![ Parameter Handlers ] ================================================================== */

    function initialize(data) {
        if (data) {
            payload = data;
        }

        var args = payload['arguments'];
        
        if (args && args.execute && args.execute.inArguments && args.execute.inArguments[0]) {
            var savedData = args.execute.inArguments[0];
            
            // Restaurar campos básicos
            if (savedData.templateName) {
                $('#templateCode').val(savedData.templateName).prop('disabled', true);
                templateCode = savedData.templateName;
            }
            
            if (savedData.phoneNumber) {
                // Extrair nome do campo do formato {{Event.xxx."fieldName"}}
                var phoneMatch = savedData.phoneNumber.match(/"([^"]+)"/);
                if (phoneMatch) {
                    $('#phoneFieldName').val(phoneMatch[1]).prop('disabled', true);
                    phoneFieldName = phoneMatch[1];
                }
            }
            
            if (savedData.account) {
                $('#whatsappAccount').val(savedData.account).prop('disabled', true);
                whatsappAccount = savedData.account;
            }
            
            // Restaurar parâmetros (incluindo header e footer com chaves específicas)
            if (savedData.parameters && savedData.parameters.length > 0) {
                $('#parametersContainer').empty();

                savedData.parameters.forEach(function(param) {
                    // Novo formato: param é um objeto como { "header_attachment": "{{Event.xxx.\"value\"}}" }
                    var key = Object.keys(param)[0];
                    var fullValue = param[key];
                    var valueMatch = fullValue.match(/"([^"]+)"/);
                    var value = valueMatch ? valueMatch[1] : fullValue;

                    // Verificar se é header (chave: header_attachment)
                    if (key === 'header_attachment') {
                        $('#headerField').val(value).prop('disabled', true);
                    }
                    // Verificar se é footer 1 (chave: button_param_0)
                    else if (key === 'button_param_0') {
                        $('#footerField1').val(value).prop('disabled', true);
                    }
                    // Verificar se é footer 2 (chave: button_param_1)
                    else if (key === 'button_param_1') {
                        $('#footerField2').val(value).prop('disabled', true);
                    }
                    // Caso contrário, é um parâmetro customizado
                    else {
                        var row = $('<div class="parameter-row">' +
                            '<div class="wrap-input100">' +
                                '<input class="input100 param-key" type="text" placeholder="Chave" value="' + key + '" disabled>' +
                                '<span class="focus-input100"></span>' +
                            '</div>' +
                            '<div class="wrap-input100">' +
                                '<input class="input100 param-value" type="text" placeholder="Valor" value="' + value + '" disabled>' +
                                '<span class="focus-input100"></span>' +
                            '</div>' +
                            '<button type="button" class="btn-remove-param" style="display:none;">−</button>' +
                        '</div>');
                        $('#parametersContainer').append(row);
                    }
                });

                updateParameterCount();
            }
            
            // Desabilitar botões
            $('#toggleActive').prop('disabled', true).text('Ativado');
            $('#btnAddParameter').prop('disabled', true);
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
            console.log(settings);
            
            eventDefinitionKey = settings.triggers[0].metaData.eventDefinitionKey;
            document.getElementById('select-entryevent-defkey').value = eventDefinitionKey;
        } catch (err) {
            console.error(err);
        }
    }

    function save() {
        // Coletar todos os parâmetros
        var params = collectParameters();

        // Formatar parâmetros com sintaxe do Journey Builder (novo formato: array de objetos com chaves dinâmicas)
        var formattedParameters = params.map(function(param) {
            var obj = {};
            obj[param.key] = `{{Event.${eventDefinitionKey}."${param.value}"}}`;
            return obj;
        });

        console.log('Formatted parameters: ', formattedParameters);

        payload['arguments'].execute.inArguments = [{
            "tokens": authTokens,
            "templateName": templateCode,
            "contactIdentifier": "{{Contact.Key}}",
            "phoneNumber": `{{Event.${eventDefinitionKey}."${phoneFieldName}"}}`,
            "parameters": formattedParameters,
            "account": whatsappAccount
        }];

        payload['metaData'] = payload['metaData'] || {};
        payload['metaData'].isConfigured = true;

        console.log("Payload on SAVE function:");
        console.log(JSON.stringify(payload));

        connection.trigger('updateActivity', payload);
    }
});