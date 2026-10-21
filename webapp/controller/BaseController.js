sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/nhpc/zsdtarifformss1/util/messenger",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/ValueState",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
    "sap/m/SearchField",
    "sap/m/Label",
    "sap/m/Text",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, messenger, BusyIndicator, Filter, FilterOperator, ValueState, DateFormat, Fragment, SearchField, Label, Text) {
        "use strict";

        return Controller.extend("com.nhpc.zsdtarifformss1.controller.BaseController", {

            /**
             * Convenience method for accessing the router.
             * @public
             * @returns {sap.ui.core.routing.Router} the router for this component
             */
            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            /* =========================================================== */
            /* Model Methods                                              */
            /* =========================================================== */

            /**
             * Convenience method for getting the view model by name.
             * @public
             * @param {string} [sName] the model name
             * @returns {sap.ui.model.Model} the model instance
             */
            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            /**
             * Convenience method for setting the view model.
             * @public
             * @param {sap.ui.model.Model} oModel the model instance
             * @param {string} sName the model name
             * @returns {sap.ui.mvc.View} the view instance
             */
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },

            /**
             * Clears model and specific property if provided
             * @param {string} sModelName Model name
             * @param {string} sProperty Property
             * @public
             */
            clearModel: function (sModelName, sProperty) { },

            /**
             * Getter for the resource bundle.
             * @public
             * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
             */
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },

            fileNameLengthExceeded: function () {
                var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                messenger.error(oResourceBundle.getText("FileLengthExceededErrMsg"), () => { });
            },

            onFileSizeExceed: function (oEvent) {
                var oResourceBundle = this.getResourceBundle();
                messenger.error(oResourceBundle.getText("fileSizeExceedErrorMsg"), () => { });
            },

            onFileTypeMismatch: function (oEvent) {
                var oResourceBundle = this.getResourceBundle();
                messenger.error(oResourceBundle.getText("fileTypeMisMatchErrorMsg"), () => { });
            },

            formatDate: function (oDate) {
                var oDateFormat = DateFormat.getDateInstance({
                    pattern: "dd.MM.yyyyy"
                });
                return oDateFormat.format(oDate);
            },

            showSuccess: function (oResp) {
                var oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                var sSuccessTxt = oResourceBundle.getText("SuccessTxt", [oResp.REQ_NO]);
                BusyIndicator.hide();
                messenger.success(sSuccessTxt, function () {
                    this.getRouter().navTo("RouteDashboard");
                    // this.setDefaults();
                }.bind(this));
            },

            showError: function (oError, navBack) {
                const sErrorMsg = JSON.parse(oError.responseText).error.message.value;
                BusyIndicator.hide();
                messenger.error(sErrorMsg, function () {
                    if (navBack) {
                        this.getRouter().navTo("RouteDashboard");
                        // this.setDefaults();
                    }
                }.bind(this));
            },
            getText: function (sKey, aArgs) {
                return this.getResourceBundle().getText(sKey, aArgs);
            },
           

            onNavBack: function () {
                this.getOwnerComponent().getRouter().navTo("RouteDashboard");
            },


            handleDownloadAttachmentPress: function (oEvent) {
                var oViewModel = this.getModel("viewModel"),
                    sPath = oEvent.getSource().getBindingInfo("text")['binding'].getContext().getPath(),
                    sUrl = oViewModel.getProperty(sPath + "/Url");
                window.open(sUrl);
            },

            onBeforeDialogOpen: function () {
                return true;
            },

            itemValidationCallback: function (oItemInfo) {
                var oItemDetails = oItemInfo.oItem,
                    oViewModel = this.getModel("viewModel"),
                    aAttachmentList = oViewModel.getProperty("/attachmentData");
                // oItemDetails.Doc_type = oViewModel.getProperty("/FileCategory");
                // change done by Kawal to set doc type as OT if notified is true
                // var sDocType =
                //     oViewModel.getProperty("/SanctionDetails/Notified") === "X" &&
                //         oViewModel.getProperty("/SanctionDetails/Status") === "C"
                //         ? "Others"
                //         : oViewModel.getProperty("/FileCategory");

                // oItemDetails.Doc_type = sDocType;
                // var sUser = "";

                // if (sap.ushell && sap.ushell.Container) {
                //     sUser = sap.ushell.Container.getUser().getFullName();
                // }
                var oEmp = oViewModel.getProperty("/EmpDetails");
                var sUploadedBy = oEmp?.ENAME;

                aAttachmentList.push({
                    "Filename": oItemDetails.getFileName(),
                    "Mimetype": oItemDetails.getMediaType(),
                    "Createdby": sUploadedBy,
                    "Createdon": new Date()
                });
                oViewModel.setProperty("/attachmentData", aAttachmentList);
                const {
                    oItem
                } = oItemInfo;
                var oItemPromise = new Promise((resolve, reject) => {
                    this.oItemsProcessor.push({
                        item: oItem,
                        resolve: resolve,
                        reject: reject
                    });
                    console.log(
                        "Attachment Added:",
                        this.oItemsProcessor.length
                    );
                });
                //this.checkMalwareValidation(oItemInfo);
                return oItemPromise;
            },

            checkMalwareValidation: function (oItemInfo) {
                var oResourceBundle = this.getResourceBundle(),
                    oFileObject = oItemInfo.oItem.getFileObject();
                if (oFileObject) {
                    var reader = new FileReader();
                    reader.onload = function (event) {
                        var aArrayBuffer = event.currentTarget.result;
                        var sBinaryString = this.convertArratBufferToBinary(aArrayBuffer);

                        var sUrl = this.getBaseURL() + "/malware_api/scan";
                        BusyIndicator.show();
                        jQuery.ajax({
                            url: sUrl,
                            type: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            data: sBinaryString,
                            success: function (oResp) {
                                if (oResp.malwareDetected) {
                                    this.removeMalwareFile();
                                    messenger.error(oResourceBundle.getText("malwareFileDetectedErrorMsg"));
                                } else {
                                    BusyIndicator.hide();
                                }
                            }.bind(this),
                            error: function (error) {
                                BusyIndicator.hide();
                                this.removeMalwareFile();
                                messenger.error(oResourceBundle.getText("malwareScanFailedErrorMsg"));
                            }.bind(this)
                        });
                    }.bind(this);
                    reader.readAsArrayBuffer(oFileObject);
                }
            },
            convertArratBufferToBinary: function (aArrayBufferObject) {
                var binary = '';
                const bytes = new Uint8Array(aArrayBufferObject);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                return binary;
            },
            removeMalwareFile: function () {
                var oViewModel = this.getModel("viewModel"),
                    aAttachmentList = oViewModel.getProperty("/attachmentData");
                aAttachmentList.pop();
                aGloabalAttachmentList.pop();
                this.oItemsProcessor.pop();

                oViewModel.setProperty("/attachmentData", aAttachmentList);
                oViewModel.refresh();
                BusyIndicator.hide();
            },

            getBaseURL: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                return appModulePath;
            },

            onRemoveAttachment: function (oEvent) {
                var oSource = oEvent.getSource();
                const oContext = oSource.getBindingContext("viewModel");
                this.removeItem(oContext);
            },

            removeItem: function (oContext) {
                var oResourceBundle = this.getResourceBundle(),
                    oViewModel = this.getModel("viewModel"),
                    sPath = oContext.getPath(),
                    sFileName = oViewModel.getProperty(sPath + "/Filename"),
                    sTitle = oResourceBundle.getText("CONFIRM_TITLE");

                var sMessage = oResourceBundle.getText("removeDocumentWarningMsg", sFileName);
                const sConfirmTitle = oResourceBundle.getText("CONFIRM_TITLE");

                messenger.confirm(sTitle, sMessage, sConfirmTitle, null, function () {
                    if (sPath.split("/")[2]) {
                        var index = sPath.split("/")[2];
                        var data = oViewModel.getProperty("/attachmentData");
                        this.oItemsProcessor.splice(index, 1);
                        data.splice(index, 1);
                        oViewModel.refresh(true);
                    }
                }.bind(this));
            },


            onAttachementsUpdateFinished: function (oEvent) {
                var oResourceBundle = this.getResourceBundle(),
                    iCount = oEvent.getParameter("total");

                this.byId("idDocumentsTitle").setText(oResourceBundle.getText("DocumentsTitle", [iCount]));
            },

            onInputChange: function (oEvent) {
                var oSrc = oEvent.getSource(),
                    sValue = oEvent.getParameter("value");
                if (sValue) {
                    oSrc.setValueState(ValueState.None);
                    oSrc.setValueStateText(null);
                }
            },

            onComboBoxChange: function (oEvent) {
                var oSrc = oEvent.getSource(),
                    sValue = oSrc.getSelectedKey();

                if (!sValue) {
                    oSrc.setValue(null);
                } else {
                    oSrc.setValueState(ValueState.None);
                    oSrc.setValueStateText(null);
                }
            },

            // onStartDatePickerChange: function (oEvent) {
            //     var oResourceBundle = this.getResourceBundle(),
            //         oSrc = oEvent.getSource(),
            //         bValidDate = oEvent.getParameter("valid");

            //     if (bValidDate) {
            //         oSrc.setValueState(ValueState.None);
            //         oSrc.setValueStateText(null);
            //         var oViewModel = this.getModel("viewModel");
            //         var sStartDate = oViewModel.getProperty("/SanctionDetails/StartDate");
            //         var oDateFormat = sap.ui.core.format.DateFormat.getInstance({ pattern: "dd.MM.yyyy" });
            //         var oStartDate = oDateFormat.parse(sStartDate);
            //         var oToday = new Date();
            //         oToday.setHours(0, 0, 0, 0);

            //         // Compare dates
            //         var oMaxDate = oStartDate > oToday ? oStartDate : oToday;

            //         // Format back to string if needed
            //         // var oMaxDateStr = oDateFormat.parse(oMaxDate);
            //         oViewModel.setProperty("/MaxDate", oMaxDate);
            //         oViewModel.setProperty("/SanctionDetails/RegistrationValidTo", "");
            //         oViewModel.setProperty("/SanctionDetails/DLValidTo", "");
            //     } else {
            //         oSrc.setValue(null);
            //         oSrc.setValueState(ValueState.Error);
            //         oSrc.setValueStateText(oResourceBundle.getText("invalidDateErrorMsg"));
            //         // messenger.error(oResourceBundle.getText("invalidDateErrorMsg"));
            //     }
            // },

            onDatePickerChange: function (oEvent) {
                var oResourceBundle = this.getResourceBundle(),
                    oSrc = oEvent.getSource(),
                    bValidDate = oEvent.getParameter("valid");

                if (bValidDate) {
                    oSrc.setValueState(ValueState.None);
                    oSrc.setValueStateText(null);
                } else {
                    oSrc.setValue(null);
                    oSrc.setValueState(ValueState.Error);
                    oSrc.setValueStateText(oResourceBundle.getText("invalidDateErrorMsg"));
                    // messenger.error(oResourceBundle.getText("invalidDateErrorMsg"));
                }
            },

            // onDLDatePickerChange: function (oEvent) {
            //     var oResourceBundle = this.getResourceBundle(),
            //         oViewModel = this.getModel("viewModel"),
            //         oSrc = oEvent.getSource(),
            //         bValidDate = oEvent.getParameter("valid");

            //     if (!oViewModel.getProperty("/SanctionDetails/StartDate")) {
            //         oSrc.setValue(null);
            //         oSrc.setValueState(ValueState.Error);
            //         oSrc.setValueStateText(oResourceBundle.getText("NoStartDateErrorMsg"));
            //     }

            //     if (bValidDate) {
            //         oSrc.setValueState(ValueState.None);
            //         oSrc.setValueStateText(null);
            //     } else {
            //         oSrc.setValue(null);
            //         oSrc.setValueState(ValueState.Error);
            //         oSrc.setValueStateText(oResourceBundle.getText("invalidDateErrorMsg"));
            //         // messenger.error(oResourceBundle.getText("invalidDateErrorMsg"));
            //     }
            // },

            onCancelDialog: function () {
                this.pDialog.then(function (oDialog) {
                    oDialog.close();
                });
            },


            //added by rudra
            createFilter: function (sProperty, oFilterOperator, sQuery) {
                return new Filter(sProperty, oFilterOperator, sQuery);
            },

            //for notification
            createNotificationPayload: function (sNotificationId, sRecipientUserId, sRequestNumber, sRequesterName) {
                return {
                    recipients: sRecipientUserId,
                    notificationId: sNotificationId, // UUID generated in UI5
                    businessProcessId: "ZManageComplianceReportApproval",
                    businessProcessVersion: "1.0",

                    // business parameters
                    businessParameter1: sRequestNumber,    // Request Number
                    businessParameter2: sRequesterName, // Employee/Requester Name

                    // navigation context
                    semanticObject: "ManageComplianceReportApproval",
                    semanticAction: "manage"
                };
            },
            dismissNotification: function (sNotificationId, oNotifyPayload) {
                var payload = {
                    notificationId: sNotificationId
                }
                var oResourceBundle = this.getResourceBundle();
                var sUrl = this.getBaseURL() + "/notify_api/customNotification/removeNotificationItem";
                BusyIndicator.show();
                jQuery.ajax({
                    url: sUrl,
                    type: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(payload),
                    success: function (oResp) {
                        BusyIndicator.hide();
                        if (oNotifyPayload.recipients.length !== 0) {
                            this.sendNotification(oNotifyPayload);
                        }
                    }.bind(this),
                    error: function (error) {
                        BusyIndicator.hide();

                    }.bind(this)
                });
            },
            sendNotification: function (payload) {
                var oResourceBundle = this.getResourceBundle();
                var sUrl = this.getBaseURL() + "/notify_api/customNotification/sendNotificationItem";
                BusyIndicator.show();
                jQuery.ajax({
                    url: sUrl,
                    type: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify(payload),
                    success: function (oResp) {
                        BusyIndicator.hide();
                        console.log(oResp);
                    }.bind(this),
                    error: function (error) {
                        BusyIndicator.hide();
                        console.log(error);
                    }.bind(this)
                });
            },
            
        });
    });