/* Javascript for KeytermsXBlock. */

// https://edx.readthedocs.io/projects/edx-developer-guide/en/latest/preventing_xss/preventing_xss.html

function KeytermsXBlock(runtime, element) {
    // Getting the handles for the python functions
    var addkeywordhandlerUrl = runtime.handlerUrl(element, 'add_keyterm');
    var removekeywordhandlerUrl = runtime.handlerUrl(element, 'remove_keyterm');
    var editlessonhandlerUrl = runtime.handlerUrl(element, 'edit_lesson');
    var getincludedkeytermshandlerUrl = runtime.handlerUrl(element, 'get_included_keyterms');

    // Variables needed to store the data for this page.
    var keytermsJson;
    var allKeytermsSet = new Set();
    var courseid;

    // Used to update the keyterms html
    function updateSummary(result) {
        edx.HtmlUtils.setHtml($('.lessonsummary'), edx.HtmlUtils.HTML(result.lessonsummary));
    }

    // Used to update the keyterms html
    function updateKeyterms(result) {
       edx.HtmlUtils.setHtml($('.allKeytermsList'), edx.HtmlUtils.HTML(result.keytermhtml));
    }

    // Used for getting courseID
    function getStringBetween(str, start, end) {
        const result = str.match(new RegExp(start + "(.*)" + end));
        return result[1];
    }

    // Gets the information about a specific keyterm
    function getKeyTermInfo(keyterm) {
        for (var i = 0; i < keytermsJson.length; i++) {
            if (keytermsJson[i]["key_name"] === keyterm) {
                return keytermsJson[i];
            }
        }
    }

    // Editing lesson summary handler
    $(".editLessonSummary").click(function(event) {
        event.preventDefault();
        var lesson = $(".lesson-field").val();
        var data = {lessonsummary: lesson};

        $.ajax({
            type: "POST",
            url: editlessonhandlerUrl,
            data: JSON.stringify(data),
            success: updateSummary
        });
    });
    
    // Used for editing the keyterms
    function populateOptions(result) {
        var available = $('#id_keyterms_from');
        var chosen = $('#id_keyterms_to');

        // Adds each term to appropriate side of list
        allKeytermsSet.forEach(term => {
            var html = edx.HtmlUtils.joinHtml(edx.HtmlUtils.HTML('<option value="'), gettext(term), edx.HtmlUtils.HTML('" title="'), 
            gettext(term), edx.HtmlUtils.HTML('">'), gettext(term), edx.HtmlUtils.HTML('</option>'));
            (result.includedkeyterms).includes(term) ? edx.HtmlUtils.append($(chosen), html) : edx.HtmlUtils.append($(available), html);
        });

        // Handle search feature
        $('#id_keyterms_input').keyup(function(){
            $('#id_keyterms_from').find('option').each(function() {
                var txt = $(this).val();
                var regex = new RegExp($('#id_keyterms_input').val(), "i");
                $(this).css("display", regex.test(txt) ? 'block':'none');
            });
        });

        // Handle double clicking an element
        $("#id_keyterms_from option").on('dblclick', function(event) {
            event.preventDefault();
            var term = $(this).val();
            data = {keyterm: term, course_id: courseid}
            $.ajax({
                type: "POST",
                url: addkeywordhandlerUrl,
                data: JSON.stringify(data),
                async: false,
                success: function(result){ updateKeyterms(result) }
            });
            $(`#id_keyterms_from option[value='${term}']`).remove();
            var html = edx.HtmlUtils.joinHtml(edx.HtmlUtils.HTML('<option value="'), gettext(term), edx.HtmlUtils.HTML('" title="'), 
            gettext(term), edx.HtmlUtils.HTML('">'), gettext(term), edx.HtmlUtils.HTML('</option>'));
            edx.HtmlUtils.append($(chosen), html);
        });

        // Handle double clicking an element
        $("#id_keyterms_to option").on('dblclick', function(event) {
            event.preventDefault();
            var term = $(this).val();
            data = {keyterm: term, course_id: courseid}
            $.ajax({
                type: "POST",
                url: removekeywordhandlerUrl,
                data: JSON.stringify(data),
                async: false,
                success: function(result){ updateKeyterms(result) }
            });
            $(`#id_keyterms_to option[value='${term}']`).remove();
            var html = edx.HtmlUtils.joinHtml(edx.HtmlUtils.HTML('<option value="'), gettext(term), edx.HtmlUtils.HTML('" title="'), 
            gettext(term), edx.HtmlUtils.HTML('">'), gettext(term), edx.HtmlUtils.HTML('</option>'));
            edx.HtmlUtils.append($(available), html);
        });
        
        // Handle selecting many elements
        $('#id_keyterms_add_link').on('click', function(event) {
            event.preventDefault();
            var arr = $.map($('#id_keyterms_from option:selected'), function(option){
                return option.value;
            });
            arr.forEach(term => {
                data = {keyterm: term, course_id: courseid}
                $.ajax({
                    type: "POST",
                    url: addkeywordhandlerUrl,
                    data: JSON.stringify(data),
                    async: false,
                    success: function(result){ updateKeyterms(result) }
                });
                $(`#id_keyterms_from option[value='${term}']`).remove();
                var html = edx.HtmlUtils.joinHtml(edx.HtmlUtils.HTML('<option value="'), gettext(term), edx.HtmlUtils.HTML('" title="'), 
                gettext(term), edx.HtmlUtils.HTML('">'), gettext(term), edx.HtmlUtils.HTML('</option>'));
                edx.HtmlUtils.append($(chosen), html);
            });
        });

        // Handle selecting many elements
        $('#id_keyterms_remove_link').on('click', function(event) {
            event.preventDefault();
            var arr = $.map($('#id_keyterms_to option:selected'), function(option){
                return option.value;
            });
            arr.forEach(term => {
                data = {keyterm: term, course_id: courseid}
                $.ajax({
                    type: "POST",
                    url: removekeywordhandlerUrl,
                    data: JSON.stringify(data),
                    async: false,
                    success: function(result){ updateKeyterms(result) }
                });
                $(`#id_keyterms_to option[value='${term}']`).remove();
                var html = edx.HtmlUtils.joinHtml(edx.HtmlUtils.HTML('<option value="'), gettext(term), edx.HtmlUtils.HTML('" title="'), 
                gettext(term), edx.HtmlUtils.HTML('">'), gettext(term), edx.HtmlUtils.HTML('</option>'));
                edx.HtmlUtils.append($(available), html);
            });
        });

        // Handle remove all button
        $('#id_keyterms_remove_all_link').on('click', function(event) {
            event.preventDefault();
            var arr = $.map($('#id_keyterms_to option'), function(option){
                return option.value;
            });
            arr.forEach(term => {
                data = {keyterm: term, course_id: courseid}
                $.ajax({
                    type: "POST",
                    url: removekeywordhandlerUrl,
                    data: JSON.stringify(data),
                    async: false,
                    success: function(result){ updateKeyterms(result) }
                });
                $(`#id_keyterms_to option[value='${term}']`).remove();
                var html = edx.HtmlUtils.joinHtml(edx.HtmlUtils.HTML('<option value="'), gettext(term), edx.HtmlUtils.HTML('" title="'), 
                gettext(term), edx.HtmlUtils.HTML('">'), gettext(term), edx.HtmlUtils.HTML('</option>'));
                edx.HtmlUtils.append($(available), html);
            });
        });

        // Handle choose all button
        $('#id_keyterms_add_all_link').on('click', function(event) {
            event.preventDefault();
            var arr = $.map($('#id_keyterms_from option'), function(option){
                return option.value;
            });
            arr.forEach(term => {
                data = {keyterm: term, course_id: courseid}
                $.ajax({
                    type: "POST",
                    url: addkeywordhandlerUrl,
                    data: JSON.stringify(data),
                    async: false,
                    success: function(result){ updateKeyterms(result) }
                });
                $(`#id_keyterms_from option[value='${term}']`).remove();

                var html = edx.HtmlUtils.joinHtml(edx.HtmlUtils.HTML('<option value="'), gettext(term), edx.HtmlUtils.HTML('" title="'), 
                gettext(term), edx.HtmlUtils.HTML('">'), gettext(term), edx.HtmlUtils.HTML('</option>'));
                edx.HtmlUtils.append($(chosen), html);
            });
        });
    }

    // initializing the data
    $(function() { 
    // Getting courseid
        const url = window.location.href;
        courseid = getStringBetween(url, 'block\-v1:', 'type').slice(0,-1);
        
        // Setting glossary url
        $("#glossarymsg").html(`Click on or hover the term to reveal the definitions on the <a target="_blank" rel="noopener noreferrer" href="http://localhost:2000/course/course-v1:${courseid}/glossary">Glossary</a> page.`)

        // Getting all the keyterms
        courseid.replace(" ", "+");
        resturl = 'http://localhost:18500/api/v1/course_terms/?course_id=course-v1:'+ courseid;

        $.getJSON(resturl,
        function(data, err) {
            // Store list of all keyterms
            keytermsJson = data;
            keytermsJson.forEach( keyterm => allKeytermsSet.add(keyterm["key_name"]));
        }).then(data=>
            { 
                // Showing information about definition on hover
                $(".keytermli").each(function() {
                    const keyterm = $(this).attr('id');
                    var keyterminfo = getKeyTermInfo(keyterm);

                    // Definitions
                    if (keyterminfo["definitions"].length > 0) {
                        var formattedContent = `<div class="outline-box"><h2>Definitions</h2><ul class="bullets">`;
                        keyterminfo["definitions"].forEach(definition => {
                            formattedContent += `<li>${definition["description"]}</li>`
                        })
                        formattedContent += `</ul></div>`;
                    }

                    // Textbooks
                    if (keyterminfo["textbooks"].length > 0) {
                        formattedContent += `<div class="outline-box"><h2>Textbooks</h2>`
                        keyterminfo["textbooks"].forEach(textbook => {
                            formattedContent += `<a target="_blank" rel="noopener noreferrer" href='http://localhost:18010/textbooks_api/course-v1:${courseid}/${textbook["textbook_link"]}' class="btn">`
                            formattedContent += `${textbook["chapter"]}\n(Page ${textbook["page_num"]})`
                            formattedContent += `</a>`
                        })
                        formattedContent += `</div>`;
                    }
                    
                    // Lessons
                    if (keyterminfo["lessons"].length > 0) {
                        formattedContent += `<div class="outline-box"><h2>Lesson Pages</h2>`
                        keyterminfo["lessons"].sort((a, b) => a.module_name === b.module_name ? (a.lesson_name > b.lesson_name ? 1: -1) : (a.module_name > b.module_name ? 1: -1))
                        var currentheading = "";
                        keyterminfo["lessons"].forEach(lesson => {
                            if (currentheading != lesson["module_name"]) {
                                currentheading = lesson["module_name"];
                                formattedContent += `<h3 style="font-size:16px; text-decoration:underline;"> ${lesson["module_name"]} <h3>`
                            }
                            formattedContent += `<a target="_blank" rel="noopener noreferrer" href='http://localhost:2000/course/course-v1:${courseid}/${lesson["lesson_link"]}' class="btn">`
                            formattedContent += `${lesson["lesson_name"]} / ${lesson["unit_name"]}`
                            formattedContent += `</a>`
                        })
                        formattedContent += `</div>`;
                    }

                    // Resources
                    if (keyterminfo["resources"].length > 0) {
                        formattedContent += `<div class="outline-box"><h2>Resources</h2><ul class="bullets">`
                        keyterminfo["resources"].forEach(resource => {
                            formattedContent += `<li><a target="_blank" rel="noopener noreferrer" href="${resource["resource_link"]}">${resource["friendly_name"]}</a></li>`
                        })
                        formattedContent += `</ul></div>`;
                    }

                    // Setting up the popover
                    $(this).popover({
                        html : true,
                        content: formattedContent,
                        title: keyterm,
                        trigger: "manual",
                    }).on("mouseenter", function() {
                        var _this = this;
                        $(this).popover("show");
                        $(".popover").on("mouseleave", function() {
                          $(_this).popover('hide');
                        });
                    }).on("mouseleave", function() {
                        var _this = this;
                        setTimeout(function() {
                          if (!$(".popover:hover").length) {
                            $(_this).popover("hide");
                          }
                        }, 100);
                    });
                });

                // Enabling popovers
                $('[data-toggle="popover"]').popover({
                    container: 'html'
                })

                var data = {course_id: courseid};
                $.ajax({
                    type: "POST",
                    url: getincludedkeytermshandlerUrl,
                    data: JSON.stringify(data),
                    success: populateOptions
                });
            }
        )
    });
}


