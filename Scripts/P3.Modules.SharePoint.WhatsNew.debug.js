﻿P3.Modules = window.P3.Modules || {};

P3.Modules.WhatsNew = function () {

    var _listId = 'Whats New';
    var _FldName_Title = 'Title';
    var _FldName_Body = 'Body';
    var _FldName_Expiry = 'Expires';
    var _FldName_ElementId = 'ElementID';
    var _FldName_Page = 'Pages';
    var _curVisisbleCallout = null;//do not add this context, as this is inaccessible in customactions
    var _completedArr = [];
    var _whatsNewListId = '';

    this.init = function () {
        
        //P3.Core.SPClientJQuery.js
        if (checkCookie(_spPageContextInfo.userId)) {
            var cookieVal = getCookie(_spPageContextInfo.userId);
            if (cookieVal == "false") {
                return;//user has set do not disturb
            }
        }

        var ctx = new SP.ClientContext.get_current();
        this.lst_WhatsNew = ctx.get_web().get_lists().getByTitle(_listId);
        var camlQuery = new SP.CamlQuery();
        camlQuery.set_viewXml('<View><Query><Where><Gt><FieldRef Name=\'Expires\' /><Value Type=\'DateTime\'><Today /></Value></Gt></Where><OrderBy><FieldRef Name=\'Order1\' Ascending=\'FALSE\'/></OrderBy></Query></View>');
        this.items_whatsNew = this.lst_WhatsNew.getItems(camlQuery);
        ctx.load(this.lst_WhatsNew);
        ctx.load(this.items_whatsNew, 'Include(Id,' + _FldName_Title + ',' + _FldName_Body + ',' + _FldName_Expiry + ',' + _FldName_ElementId + ',' + _FldName_Page + ')');
        ctx.executeQueryAsync(Function.createDelegate(this, successWhatsNewQuery), Function.createDelegate(this, failedWhatsNewQuery));
    }

    var successWhatsNewQuery = function (sender, args) {
        _whatsNewListId = this.lst_WhatsNew.get_id();
        var itemsEnum = this.items_whatsNew.getEnumerator();
        while (itemsEnum.moveNext()) {
            var curItem = itemsEnum.get_current();
            var pageChoices = curItem.get_item(_FldName_Page);
            pageChoices.forEach(function (pageChoice) {
                if (decodeURI(location.href.toLowerCase()).indexOf(pageChoice.toLowerCase()) > 0) {
                    _completedArr.push(curItem);
                    return;
                } else if (pageChoice.toLowerCase() == "all") {
                    _completedArr.push(curItem);
                    return;
                }
            });
        }

        showCallouts();
    }

    var failedWhatsNewQuery = function (sender, args) {
        //ignore or log to console
    }

    var showCallouts = function () {
        if (_completedArr.length > 0) {
            var curItem = _completedArr.pop();
            var calloutObj = calloutManager.createNewIfNecessary({
                ID: curItem.get_id(),
                title: curItem.get_item(_FldName_Title),
                content: curItem.get_item(_FldName_Body),
                launchPoint: document.getElementById(curItem.get_item(_FldName_ElementId)),
                openOptions: { event: "hover", showCloseButton: false },
                onClosedCallback: function (calloutObj) {
                    calloutManager.remove(calloutObj);
                    showCallouts();
                }
            });

            this.action_nxt = new CalloutActionOptions();
            this.action_nxt.text = 'Next';
            this.action_nxt.onClickCallback = function (event, action) {
                if (_curVisisbleCallout != null) {
                    _curVisisbleCallout.close(true);
                }
            };
            this.action_later = new CalloutActionOptions();
            this.action_later.text = 'Later';
            this.action_later.onClickCallback = function (event, action) {
                if (_curVisisbleCallout != null) {
                    clearCallouts();
                    _curVisisbleCallout.close(true);
                }
            };
            this.action_dnd = new CalloutActionOptions();
            this.action_dnd.text = 'Do not disturb';
            this.action_dnd.onClickCallback = function (event, action) {
                setCookie(_spPageContextInfo.userId, false, 3, "Path=" + _spPageContextInfo.webServerRelativeUrl);     //P3.Core.SPClientJQuery.js        //set expire in 3 days
                if (_curVisisbleCallout != null) {
                    clearCallouts();
                    _curVisisbleCallout.close(true);
                }
            };

            calloutObj.addAction(new CalloutAction(this.action_nxt));
            calloutObj.addAction(new CalloutAction(this.action_later));
            calloutObj.addAction(new CalloutAction(this.action_dnd));
            if (calloutObj.open()) {
                _curVisisbleCallout = calloutObj;
            }
        }
    }

    var clearCallouts = function () {
        _completedArr = [];
    }

    var handleNewItemSelection = function () {

        var selectorHtml = '<div id="whatsNewSelector">' +
            '    <div id="whatsNewSelector-top"></div>' +
            '    <div id="whatsNewSelector-left"></div>' +
            '    <div id="whatsNewSelector-right"></div>' +
            '    <div id="whatsNewSelector-bottom"></div>' +
            '</div>';


        if (document.getElementById("whatsNewSelector") == null) {
            var div = document.createElement("div");
            div.innerHTML = selectorHtml;
            document.querySelector("body").appendChild(div.firstChild);
        }

        var elements = {
            top: $('#whatsNewSelector-top'),
            left: $('#whatsNewSelector-left'),
            right: $('#whatsNewSelector-right'),
            bottom: $('#whatsNewSelector-bottom')
        };

        $(document).on('click', function (event) {
            event.preventDefault();
            window.location.hash = window.location.hash.replace("#whatsNewItem", "");
            OpenPopUpPage(_spPageContextInfo.webAbsoluteUrl + "/Lists/WhatsNew/NewForm.aspx?EID=" + event.target.id), function () { window.location.reload(); });
            $(document).off('mousemove');
            $("#whatsNewSelector").hide();
        });

        $('a[onclick]').each(function () {
            $(this).attr('onclick', '');
        });

        $(document).off('mousemove').on('mousemove', function (event) {
            if (event.target.id.indexOf('whatsNewSelector') !== -1 || event.target.tagName === 'BODY' || event.target.tagName === 'HTML') return;
            if (event.target.id == "" || event.target.id == null || event.target.id === undefined) { $("#whatsNewSelector").hide(); return; }

            $("#whatsNewSelector").show();

            var $target = $(event.target);
            targetOffset = $target[0].getBoundingClientRect(),
                targetHeight = targetOffset.height,
                targetWidth = targetOffset.width;


            elements.top.css({
                left: (targetOffset.left - 4),
                top: (targetOffset.top - 4),
                width: (targetWidth + 5)
            });
            elements.bottom.css({
                top: (targetOffset.top + targetHeight + 1),
                left: (targetOffset.left - 3),
                width: (targetWidth + 4)
            });
            elements.left.css({
                left: (targetOffset.left - 5),
                top: (targetOffset.top - 4),
                height: (targetHeight + 8)
            });
            elements.right.css({
                left: (targetOffset.left + targetWidth + 1),
                top: (targetOffset.top - 4),
                height: (targetHeight + 8)
            });

        });
    }

    this.openNewWhatsNewItem = function () {
        var hash = decodeURIComponent(window.location.hash);
        if (hash.indexOf("whatsNewItem") > -1) {
            window.location.hash += "#whatsNewItem";
        } else {
            window.location.hash += "#whatsNewItem";
        }
    }

    function locationHashChanged() {
        if (location.hash.indexOf("#whatsNewItem") > -1) {
            handleNewItemSelection();
        }
    }
    
    window.onhashchange = locationHashChanged;
}

var whatsNewManager;

ExecuteOrDelayUntilScriptLoaded(function () {
    $(document).ready(function () {

        whatsNewManager = new P3.Modules.WhatsNew();

        SP.SOD.executeFunc("callout.js", "Callout", whatsNewManager.init);


        $.get(_spPageContextInfo.webAbsoluteUrl + '/P3/Scripts/P3.Modules.SharePoint.WhatsNew.css', function (data) {
            var style = document.createElement('style'),
                head = document.getElementsByTagName('head')[0] || document.documentElemen;

            style.type = "text/css";
            style.textContent = style.text = data;

            head.appendChild(style, head.firstChild);
        });

        JSRequest.EnsureSetup();
        var eid = JSRequest.QueryString["EID"];

        if (eid !== undefined) {
            $("input[title='ElementID Required Field']").val(decodeURIComponent(eid));
        }

    });

}, 'sp.js');
