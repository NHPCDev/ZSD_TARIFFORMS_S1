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
            // getDisplayCaseDetails: function (applicationNo, Status) {

            //     var oViewModel = this.getView().getModel("viewModel");

            //     oViewModel.setProperty("/valueState", {});
            //     oViewModel.setProperty("/valueStateText", {});
            //     oViewModel.setProperty("/appNoEnabled", true);
            //     oViewModel.setProperty("/displayCase", true);
            //     oViewModel.setProperty("/SanctionDetails", {});
            //     oViewModel.setProperty("/attachmentData", []);
            //     oViewModel.setProperty("/InvoiceItems", []);

            //     this.setDisplayDetails(applicationNo);

            // },
            // setDisplayDetails: function (applicationNo) {

            //     var oModel = this.getView().getModel();
            //     var oViewModel = this.getView().getModel("viewModel");

            //     BusyIndicator.show();

            //     oModel.read("/ZUPSI_CDS_LOGGEDEMPINFO", {
            //         success: function (oResp) {

            //             BusyIndicator.hide();

            //             if (oResp.results && oResp.results.length > 0) {

            //                 oViewModel.setProperty(
            //                     "/EmpDetails",
            //                     oResp.results[0]
            //                 );
            //             }

            //         }.bind(this),

            //         error: function (oError) {

            //             BusyIndicator.hide();
            //             this.showError(oError, true);

            //         }.bind(this)
            //     });

            //     oModel.read(
            //         "/ZUPSI_CDS_EVENTS('" + applicationNo + "')",
            //         {
            //             success: function (oResp) {

            //                 BusyIndicator.hide();

            //                 console.log("Header Response", oResp);

            //                 oViewModel.setProperty(
            //                     "/SanctionDetails",
            //                     oResp
            //                 );

            //                 // Draft check
            //                 var bDraft =
            //                     oResp.Status === "Draft" ||
            //                     oResp.Status === "D";

            //                 oViewModel.setProperty("/editable", bDraft);

            //                 oViewModel.setProperty(
            //                     "/notifiedEditable",
            //                     bDraft
            //                 );

            //                 oViewModel.setProperty(
            //                     "/stopBtnVisible",
            //                     bDraft
            //                 );

            //                 oViewModel.setProperty(
            //                     "/editableActions",
            //                     bDraft
            //                 );
            //                 oViewModel.setProperty(
            //                     "/partyTableMode",
            //                     bDraft ? "SingleSelectLeft" : "None"
            //                 );

            //                 // Line items
            //                 this.getSharingDetails(applicationNo);

            //                 // Attachments
            //                 this.getAttachmentData(applicationNo);

            //             }.bind(this),

            //             error: function (oError) {

            //                 BusyIndicator.hide();
            //                 this.showError(oError, true);

            //             }.bind(this)
            //         }
            //     );
            // },
            // getSharingDetails: function (sReqNo) {

            //     var oModel = this.getView().getModel();
            //     var oViewModel = this.getView().getModel("viewModel");

            //     var aFilters = [
            //         new Filter(
            //             "Sharereqno",
            //             FilterOperator.EQ,
            //             sReqNo
            //         )
            //     ];

            //     oModel.read("/ZUPSI_CDS_SHARING", {
            //         filters: aFilters,

            //         success: function (oResp) {

            //             console.log("Party Data", oResp.results);

            //             oResp.results.forEach(function (oItem) {

            //                 oItem.EmployeeNo = oItem.Taggedempno;

            //             });

            //             oViewModel.setProperty(
            //                 "/partyDetails",
            //                 oResp.results
            //             );

            //         }.bind(this),

            //         error: function (oError) {
            //             console.log(oError);
            //         }
            //     });
            // },
            // getCreateCaseDetails: function () {
            //     var oViewModel = this.getView().getModel("viewModel");
            //     // Clear previous value states
            //     oViewModel.setProperty("/valueState", {});
            //     oViewModel.setProperty("/valueStateText", {});
            //     oViewModel.setProperty("/editable", true);
            //     oViewModel.setProperty("/appNoEnabled", false);
            //     oViewModel.setProperty("/displayCase", false);
            //     oViewModel.setProperty("/SanctionDetails", {});
            //     oViewModel.setProperty("/SanctionDetails/Status", "New");
            //     oViewModel.setProperty("/attachmentData", []);
            //     oViewModel.setProperty("/FileCategory", "");
            //     this.setCreateDetails();
            // },


            // setCreateDetails: function () {

            //     var oModel = this.getOwnerComponent().getModel();
            //     var oViewModel = this.getView().getModel("viewModel");

            //     // Current Date set
            //     oViewModel.setProperty("/currentDate", new Date());

            //     oViewModel.setProperty(
            //         "/SanctionDetails/Dateofsharing",
            //         new Date()
            //     );

            //     BusyIndicator.show();

            //     // 1. Employee Info call
            //     oModel.read("/ZUPSI_CDS_LOGGEDEMPINFO", {
            //         success: function (oResp) {

            //             BusyIndicator.hide();

            //             if (oResp.results && oResp.results.length > 0) {
            //                 oViewModel.setProperty("/EmpDetails", oResp.results[0]);
            //             }

            //         }.bind(this),

            //         error: function (oError) {

            //             BusyIndicator.hide();
            //             this.showError(oError, true);

            //         }.bind(this)
            //     });

            //     // 2. UPSI TYPES (Dropdown data)
            //     oModel.read("/ZUPSI_CDS_TYPES", {
            //         success: function (oData) {

            //             console.log("UPSI Types Data:", oData.results);

            //             // OPTIONAL: bind to model if needed
            //             oViewModel.setProperty("/UpsiTypes", oData.results);

            //         }.bind(this),

            //         error: function (oError) {

            //             console.log("UPSI Types Error:", oError);

            //         }
            //     });
            // },
            // fileUpload: function (referenceNum) {
            //     var oModel = this.getModel(),
            //         aAttachments = this.oItemsProcessor,
            //         sUrl = oModel.sServiceUrl;
            //     BusyIndicator.show();
            //     this.sReferenceNumber = referenceNum;
            //     var oResourceBundle = this.getResourceBundle();
            //     if (aAttachments && aAttachments.length > 0) {
            //         this.iNoOfAttachments = aAttachments.length;
            //         for (var i = 0; i < aAttachments.length; i++) {
            //             var oAttachment = aAttachments[i].item;
            //             var sDocType = oAttachment.Doc_type;
            //             oAttachment.addHeaderField(new sap.ui.core.Item({
            //                 key: "slug",
            //                 text: referenceNum + "/" + oAttachment.getFileName()
            //             }));
            //             oAttachment.addHeaderField(new sap.ui.core.Item({
            //                 key: "X-CSRF-Token",
            //                 text: oModel.getSecurityToken()
            //             }));
            //             this.oUploadPluginInstance.setUploadUrl(sUrl + "/AttachmentSet");

            //             aAttachments[i].resolve(oAttachment);
            //         }
            //     } else {
            //         BusyIndicator.hide();
            //         var sSuccessTxt = oResourceBundle.getText("SuccessTxt", [this.sAction === "D" ? "Saved" : "Submitted", this.sReferenceNumber]);
            //         messenger.success(sSuccessTxt, function () {
            //             this.getRouter().navTo("RouteDashboard");
            //             // this.setDefaults();
            //         }.bind(this));
            //     }
            // },

            // onUploadComplete: function (oEvent) {
            //     var oResourceBundle = this.getResourceBundle(),
            //         status = oEvent.getParameter("status");
            //     this.iUploadCount = this.iUploadCount + 1;
            //     if (status === 500) {
            //         this.isAttachmentFail = true;
            //         var oParser = new DOMParser();
            //         var oResponse = oParser.parseFromString(oEvent.getParameter("response"), "text/xml");
            //         var aMessages = oResponse.getElementsByTagName("message");
            //         if (aMessages && aMessages.length > 0) {
            //             var sMessage = aMessages[0].innerHTML;
            //             this.sUploadMessage = sMessage + "\n";
            //         }
            //     }

            //     if (this.iNoOfAttachments === this.iUploadCount) {
            //         BusyIndicator.hide();
            //         if (this.isAttachmentFail) {
            //             messenger.error(this.sUploadMessage);
            //         } else {
            //             BusyIndicator.hide();
            //             var sSuccessTxt = oResourceBundle.getText("SuccessTxt", [this.sAction === "D" ? "Saved" : "Submitted", this.sReferenceNumber]);
            //             messenger.success(sSuccessTxt, function () {
            //                 this.getRouter().navTo("RouteDashboard");
            //                 // this.setDefaults();
            //             }.bind(this));
            //         }
            //     }
            // },

            // openPreview: function (oEvent) {
            //     console.log(
            //         "Upload Plugin:",
            //         this.oUploadPluginInstance
            //     );
            //     const oSource = oEvent.getSource();
            //     const oBindingContext = oSource.getBindingContext("viewModel");
            //     console.log(
            //         "Attachment Data:",
            //         oBindingContext.getObject()
            //     );
            //     if (oBindingContext && this.oUploadPluginInstance) {
            //         this.oUploadPluginInstance.openFilePreview(oBindingContext);
            //     }
            // },

            onNavBack: function () {
                this.getOwnerComponent().getRouter().navTo("RouteDashboard");
            },


            // getAttachmentData: function (sReqNo) {

            //     var oModel = this.getModel();
            //     var oViewModel = this.getModel("viewModel");

            //     var aFilters = [
            //         new Filter(
            //             "Sharereqno",
            //             FilterOperator.EQ,
            //             sReqNo
            //         )
            //     ];

            //     oModel.read("/AttachmentSet", {
            //         filters: aFilters,

            //         success: function (oResponse) {

            //             var aAttachments = oResponse.results;

            //             for (var i = 0; i < aAttachments.length; i++) {

            //                 aAttachments[i].preview = true;
            //                 aAttachments[i].trustedSource = true;

            //                 aAttachments[i].Url = this.getDownloadUrl(
            //                     aAttachments[i].Sharereqno,
            //                     aAttachments[i].DocId,
            //                     aAttachments[i].Filename
            //                 );

            //                 console.log("Attachment URL:", aAttachments[i].Url);
            //             }

            //             oViewModel.setProperty(
            //                 "/attachmentData",
            //                 aAttachments
            //             );

            //         }.bind(this),

            //         error: function (oError) {
            //             console.log(oError);
            //         }
            //     });
            // },
            // getDownloadUrl: function (sReqNo, iDocId, sFileName) {

            //     var oModel = this.getModel();

            //     return oModel.sServiceUrl +
            //         "/AttachmentSet(Sharereqno='" +
            //         sReqNo +
            //         "',DocId=" +
            //         iDocId +
            //         ",Filename='" +
            //         encodeURIComponent(sFileName) +
            //         "')/$value";
            // },


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

            // handleSaveBtnPress: function (oEvent) {
            //     this.sAction = "D";
            //     this.postData("D");
            // },

            // handleSubmitBtnPress: function (oEvent) {

            //     var oViewModel = this.getModel("viewModel");
            //     var oData = oViewModel.getData().SanctionDetails;
            //     var bValid = true;
            //     var oResourceBundle = this.getResourceBundle();

            //     if (!oData.StartDate) {
            //         bValid = false;
            //         oViewModel.setProperty('/valueState/StartDate', ValueState.Error);
            //         oViewModel.setProperty('/valueStateText/StartDate', oResourceBundle.getText("errMandatoryFieldErrorMsg"));
            //     }

            //     if (!oData.VehicleType) {
            //         bValid = false;
            //         oViewModel.setProperty('/valueState/VehicleType', ValueState.Error);
            //         oViewModel.setProperty('/valueStateText/VehicleType', oResourceBundle.getText("errMandatoryFieldErrorMsg"));
            //     }


            //     if (!oData.VehicleRegNo) {
            //         bValid = false;
            //         oViewModel.setProperty('/valueState/VehicleRegNo', ValueState.Error);
            //         oViewModel.setProperty('/valueStateText/VehicleRegNo', oResourceBundle.getText("errMandatoryFieldErrorMsg"));
            //     }

            //     if (!oData.DLNo) {
            //         bValid = false;
            //         oViewModel.setProperty('/valueState/DLNumber', ValueState.Error);
            //         oViewModel.setProperty('/valueStateText/DLNumber', oResourceBundle.getText("errMandatoryFieldErrorMsg"));
            //     }

            //     if (!oData.VehicleInsuranceNo) {
            //         bValid = false;
            //         oViewModel.setProperty('/valueState/insuranceNumber', ValueState.Error);
            //         oViewModel.setProperty('/valueStateText/insuranceNumber', oResourceBundle.getText("errMandatoryFieldErrorMsg"));
            //     }

            //     if (!oData.RegistrationValidTo) {
            //         bValid = false;
            //         oViewModel.setProperty('/valueState/RegValidUpTo', ValueState.Error);
            //         oViewModel.setProperty('/valueStateText/RegValidUpTo', oResourceBundle.getText("errMandatoryFieldErrorMsg"));
            //     }

            //     if (!oData.DLValidTo) {
            //         bValid = false;
            //         oViewModel.setProperty('/valueState/DLValidUpTo', ValueState.Error);
            //         oViewModel.setProperty('/valueStateText/DLValidUpTo', oResourceBundle.getText("errMandatoryFieldErrorMsg"));
            //     }

            //     if (!oData.InsuranceValidTo) {
            //         bValid = false;
            //         oViewModel.setProperty('/valueState/InsuranceValidUpTo', ValueState.Error);
            //         oViewModel.setProperty('/valueStateText/InsuranceValidUpTo', oResourceBundle.getText("errMandatoryFieldErrorMsg"));
            //     }

            //     if (bValid) {
            //         if (this.validateMandatoryAttachments()) {
            //             this.sAction = "S";
            //             this.postData("S");
            //         }
            //     } else {
            //         messenger.error(oResourceBundle.getText("errMandatoryFieldErrorMsg"))
            //     }


            //     // this.postData("S");
            // },
            // onValueHelpRequest: function (oEvent) {

            //     var oController = this;

            //     var oSource = oEvent.getSource();

            //     this._currInputId = oSource.getId();
            //     this._currSource = oSource;

            //     var sValueHelpName = oSource.data("valuehelp");

            //     var oValueHelp = this.fnGetValueHelpDetails(sValueHelpName);

            //     if (!oValueHelp) {
            //         sap.m.MessageToast.show("Value Help Config not found");
            //         return;
            //     }

            //     var aCols = oValueHelp.model.getData().cols;

            //     this._oBasicSearchField = new sap.m.SearchField();

            //     this.loadFragment({
            //         name: oValueHelp.ValueHelpFragmentPath
            //     }).then(function () {

            //         this._oValueHelpDialog = sap.ui.xmlfragment(
            //             oValueHelp.ValueHelpFragmentPath,
            //             this
            //         );

            //         this.getView().addDependent(this._oValueHelpDialog);

            //         var oFilterBar = this._oValueHelpDialog.getFilterBar();

            //         oFilterBar.setFilterBarExpanded(false);
            //         oFilterBar.setBasicSearch(this._oBasicSearchField);

            //         this._oBasicSearchField.attachSearch(function (oEvt) {
            //             oController.onFilterSearch(oEvt, sValueHelpName);
            //         });

            //         this._oBasicSearchField.setMaxLength(
            //             oValueHelp.maxLength
            //         );

            //         this._configureProperties(
            //             this._oValueHelpDialog,
            //             sValueHelpName
            //         );

            //         this._oValueHelpDialog.getTableAsync().then(function (oTable) {

            //             oTable.setModel(this.getModel());

            //             // Desktop Table
            //             if (oTable.bindRows) {

            //                 oTable.bindRows({
            //                     path: oValueHelp.bindingpath,
            //                     events: {
            //                         dataReceived: function () {
            //                             oController._oValueHelpDialog.update();
            //                         }
            //                     }
            //                 });

            //                 for (var i = 0; i < aCols.length; i++) {

            //                     var oColumn =
            //                         new sap.ui.table.Column({

            //                             label: new sap.m.Label({
            //                                 text: aCols[i].label
            //                             }),

            //                             template: new sap.m.Text({
            //                                 text: "{" + aCols[i].template + "}"
            //                             })
            //                         });

            //                     oColumn.data({
            //                         fieldName: aCols[i].template
            //                     });

            //                     oTable.addColumn(oColumn);
            //                 }
            //             }

            //             // Mobile Table
            //             if (oTable.bindItems) {

            //                 var aCells = [];

            //                 aCols.forEach(function (oCol) {

            //                     aCells.push(
            //                         new sap.m.Label({
            //                             text: "{" + oCol.template + "}"
            //                         })
            //                     );

            //                 });

            //                 oTable.bindItems({
            //                     path: oValueHelp.bindingpath,
            //                     template: new sap.m.ColumnListItem({
            //                         cells: aCells
            //                     }),
            //                     events: {
            //                         dataReceived: function () {
            //                             oController._oValueHelpDialog.update();
            //                         }
            //                     }
            //                 });

            //                 aCols.forEach(function (oCol) {

            //                     oTable.addColumn(
            //                         new sap.m.Column({
            //                             header: new sap.m.Label({
            //                                 text: oCol.label
            //                             })
            //                         })
            //                     );

            //                 });
            //             }

            //             this._oValueHelpDialog.update();

            //         }.bind(this));

            //         this._oValueHelpDialog.open();

            //     }.bind(this));
            // },
            // onFilterSearch: function (oEvent, valuehelpname) {
            //     let sValue = oEvent.getSource().getValue();
            //     this._performVHSearch(sValue, valuehelpname)
            // },
            // _performVHSearch: function (sValue, sValueHelpName) {

            //     this._oValueHelpDialog.getTableAsync().then(function (oTable) {

            //         var aFilters = [];

            //         if (sValueHelpName === "employee") {

            //             aFilters.push(
            //                 new Filter({
            //                     filters: [
            //                         new Filter(
            //                             "PERNR",
            //                             FilterOperator.Contains,
            //                             sValue
            //                         ),
            //                         new Filter(
            //                             "ENAME",
            //                             FilterOperator.Contains,
            //                             sValue
            //                         ),
            //                         new Filter(
            //                             "DESIG",
            //                             FilterOperator.Contains,
            //                             sValue
            //                         )
            //                     ],
            //                     and: false
            //                 })
            //             );
            //         }

            //         if (sValueHelpName === "department") {

            //             aFilters.push(
            //                 new Filter({
            //                     filters: [
            //                         new Filter(
            //                             "Dep_code",
            //                             FilterOperator.Contains,
            //                             sValue
            //                         ),
            //                         new Filter(
            //                             "Dep",
            //                             FilterOperator.Contains,
            //                             sValue
            //                         ),
            //                         new Filter(
            //                             "Plant",
            //                             FilterOperator.Contains,
            //                             sValue
            //                         )
            //                     ],
            //                     and: false
            //                 })
            //             );
            //         }

            //         if (oTable.getBinding("rows")) {
            //             oTable.getBinding("rows").filter(aFilters);
            //         }

            //         if (oTable.getBinding("items")) {
            //             oTable.getBinding("items").filter(aFilters);
            //         }

            //     }.bind(this));

            // },
            // fnGetValueHelpDetails: function (sValueHelp) {

            //     var oValueHelp = {};
            //     var sPath = "com.nhpc.zsdtarifformss1.";
            //     var sFragment = "fragment.MultiInputValueHelp";

            //     if (sValueHelp === "employee") {

            //         oValueHelp = {
            //             model: this.oEmployeeModel,
            //             ValueHelpFragmentPath: sPath + sFragment,
            //             bindingpath: "/zupsi_cds_empinfo",
            //             input: this._currSource,
            //             maxLength: 100
            //         };
            //     }

            //     if (sValueHelp === "department") {

            //         oValueHelp = {
            //             model: this.oDepartmentModel,
            //             ValueHelpFragmentPath: sPath + sFragment,
            //             bindingpath: "/ZUPSI_CDS_DIVISION",
            //             input: this._currSource,
            //             maxLength: 100
            //         };
            //     }

            //     return oValueHelp;
            // },
            // _configureProperties: function (oValueHelp, sValueHelp) {

            //     oValueHelp.sValueHelpName = sValueHelp;

            //     if (sValueHelp === "employee") {

            //         oValueHelp.setTitle("Employee");
            //         oValueHelp.setKey("PERNR");
            //         oValueHelp.setDescriptionKey("ENAME");
            //         oValueHelp.setSupportMultiselect(false);
            //         oValueHelp.setSupportRanges(false);
            //     }

            //     if (sValueHelp === "department") {

            //         oValueHelp.setTitle("Department");
            //         oValueHelp.setKey("Dep_code");
            //         oValueHelp.setDescriptionKey("Dep");
            //         oValueHelp.setSupportMultiselect(false);
            //         oValueHelp.setSupportRanges(false);
            //     }
            // },
            // onValueHelpOkPress: function (oEvent) {

            //     var aTokens = oEvent.getParameter("tokens");
            //     var sValueHelpName = oEvent.getSource().sValueHelpName;
            //     var oVM = this.getModel("viewModel");

            //     if (!aTokens || !aTokens.length) {
            //         this._oValueHelpDialog.close();
            //         return;
            //     }

            //     var oRowData = aTokens[0].getCustomData()[0].getValue();

            //     if (sValueHelpName === "employee") {

            //         oVM.setProperty("/partyObject/Typeofparty", "EMPLOYEE");

            //         oVM.setProperty("/partyObject/EmployeeNo", oRowData.PERNR);
            //         oVM.setProperty("/partyObject/Nameofperson", oRowData.ENAME);
            //         oVM.setProperty("/valueState/EmployeeNo", "None");
            //         oVM.setProperty("/valueStateText/EmployeeNo", "");
            //         oVM.setProperty("/partyObject/Addressofparty", oRowData.PLANT);
            //         oVM.setProperty("/partyObject/Mobileno", oRowData.MOBILE);

            //         //  Identity default PAN
            //         oVM.setProperty("/partyObject/Identitytype", "PAN");
            //         oVM.setProperty("/partyObject/IdentitytypeText", "PAN");

            //         //  IMPORTANT: value must be filled from backend field
            //         oVM.setProperty("/partyObject/Identityvalue", oRowData.PAN || ""); // Assuming PAN is part of the employee data, else set it to empty
            //     }
            //     if (sValueHelpName === "department") {

            //         oVM.setProperty("/partyObject/Typeofparty", "DEPARTMENT");
            //         oVM.setProperty("/partyObject/DepartmentNo", oRowData.Dep_code);
            //         oVM.setProperty("/partyObject/DepartmentText", oRowData.Dep);
            //         oVM.setProperty("/partyObject/DepartmentDisplay",
            //             oRowData.Dep_code + " - " + oRowData.Dep
            //         );
            //         oVM.setProperty("/valueState/DepartmentDisplay", "None");
            //         oVM.setProperty("/valueStateText/DepartmentDisplay", "");
            //         //  clear employee data completely
            //         oVM.setProperty("/partyObject/EmployeeNo", "");
            //         oVM.setProperty("/partyObject/Nameofperson", "");
            //         oVM.setProperty("/partyObject/Addressofparty", "");
            //         oVM.setProperty("/partyObject/Mobileno", "");
            //         oVM.setProperty("/partyObject/Identitytype", "");
            //         oVM.setProperty("/partyObject/IdentitytypeText", "");
            //         oVM.setProperty("/partyObject/Identityvalue", "");

            //         // UI control reset
            //         oVM.setProperty("/ui/showEmployee", false);
            //         oVM.setProperty("/ui/showDepartment", true);
            //         oVM.setProperty("/ui/isAuditorRelative", false);
            //         oVM.setProperty("/ui/isManual", false);
            //     }
            //     this._oValueHelpDialog.close();
            // },
            // onValueHelpCancelPress: function () {
            //     this._oValueHelpDialog.close();
            // },
            // onValueHelpAfterClose: function () {
            //     this._oValueHelpDialog.destroy();
            // },
            // onValueHelpChange: function (oEvent) {

            //     var oController = this;
            //     var sValueHelpName = oEvent.getSource().data("valuehelp");

            //     this.handleF4Input({
            //         oController: oController,
            //         oEvent: oEvent,
            //         sValueHelp: sValueHelpName
            //     });
            // },
            // handleF4Input: function ({ oController, oEvent, sValueHelp }) {
            //     const oViewModel = oController.getModel("viewModel");
            //     const oResourceBundle = oController.getResourceBundle();
            //     const sInputValue = oEvent.getParameter("value");

            //     if (!sInputValue) return;

            //     const oVHConfig = oController.fnGetValueHelpDetailsChange(sValueHelp, sInputValue);
            //     if (!oVHConfig) return;

            //     const oModel = oVHConfig.modelName ? oController.getModel(oVHConfig.modelName) : oController.getModel();

            //     const sTargetPath = `${oVHConfig.targetPathPrefix}${oVHConfig.property}`;
            //     const sValueStatePath = `/valueState/${oVHConfig.property}`;
            //     const sValueStateTextPath = `/valueStateText/${oVHConfig.property}`;

            //     BusyIndicator.show();

            //     oModel.read(oVHConfig.entityPath, {
            //         filters: oVHConfig.filters || [],
            //         success: function (oData) {
            //             BusyIndicator.hide();

            //             if (oData?.results?.length > 0) {
            //                 const oResult = oData.results[0];
            //                 let sValue = "";

            //                 switch (oVHConfig.sHelpStr) {

            //                     case "employee":
            //                         sValue = oResult.PERNR;
            //                         break;

            //                     case "department":
            //                         sValue = oResult.Dep_code + " - " + oResult.Dep;
            //                         break;

            //                     case "Location":
            //                         sValue = oResult.CourseTypeText;
            //                         oViewModel.setProperty("/taskDetail/location", oResult.CourseType);
            //                         break;
            //                 }
            //                 oViewModel.setProperty(sTargetPath, sValue);
            //                 oViewModel.setProperty(sValueStatePath, "None");
            //                 oViewModel.setProperty(sValueStateTextPath, "");
            //             } else {
            //                 oViewModel.setProperty(sTargetPath, "");
            //                 oViewModel.setProperty(sValueStatePath, "Error");
            //                 oViewModel.setProperty(sValueStateTextPath, oResourceBundle.getText(oVHConfig.invalidTextKey));
            //             }
            //         },
            //         error: function () {
            //             BusyIndicator.hide();
            //             oViewModel.setProperty(sTargetPath, "");
            //             oViewModel.setProperty(sValueStatePath, "Error");
            //             oViewModel.setProperty(sValueStateTextPath, oResourceBundle.getText(oVHConfig.invalidTextKey));
            //         }
            //     });
            // },
            // fnGetValueHelpDetailsChange: function (sValueHelp, sInputValue) {

            //     switch (sValueHelp) {

            //         case "employee":
            //             return {
            //                 sHelpStr: "employee",
            //                 entityPath: "/zupsi_cds_empinfo",
            //                 property: "EmployeeNo",
            //                 targetPathPrefix: "/partyObject/",
            //                 filters: [
            //                     new Filter(
            //                         "PERNR",
            //                         FilterOperator.EQ,
            //                         sInputValue
            //                     )
            //                 ],
            //                 invalidTextKey: "invalidEmployee"
            //             };

            //         case "department":
            //             return {
            //                 sHelpStr: "department",
            //                 entityPath: "/ZUPSI_CDS_DIVISION",
            //                 property: "DepartmentDisplay",
            //                 targetPathPrefix: "/partyObject/",
            //                 filters: [
            //                     new Filter(
            //                         "Dep_code",
            //                         FilterOperator.EQ,
            //                         sInputValue
            //                     )
            //                 ],
            //                 invalidTextKey: "invalidDepartment"
            //             };

            //         default:
            //             return null;
            //     }
            // },

            // onPartyTableUpdateFinished: function (oEvent) {

            //     var iCount = oEvent.getSource().getItems().length;

            //     var sTitle = this.getResourceBundle().getText(
            //         "partyDetails"
            //     );

            //     this.byId("idPartyTitle").setText(
            //         sTitle + " (" + iCount + ")"
            //     );
            // },
            // onDashboardTypeChange: function (oEvent) {

            //     var sKey = oEvent.getParameter("item").getKey();

            //     this.getModel("viewModel").setProperty("/tableType", sKey);

            //     sessionStorage.setItem("tableType", sKey);
            // },


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
            onNumberInputChange: function (oEvent) {
                let sValue = oEvent.getParameter("value");
                var oControl = oEvent.getSource();
                oControl.setValueState("None");
                oControl.setValueStateText("");
                sValue = sValue.replace(/\D/g, "");
                oEvent.getSource().setValue(sValue);
            },
            onDecimalNumberChange: function (oEvent) {
                var oControl = oEvent.getSource();
                var sValue = oEvent.getParameter("value") || "";

                oControl.setValueState("None");
                oControl.setValueStateText("");

                // Only numbers and dot
                sValue = sValue.replace(/[^0-9.]/g, "");

                // Don't allow "." as first character
                if (sValue.startsWith(".")) {
                    sValue = "";
                }

                // Only one dot
                var iDotIndex = sValue.indexOf(".");

                if (iDotIndex !== -1) {
                    var sIntegerPart = sValue.substring(0, iDotIndex);
                    var sDecimalPart = sValue.substring(iDotIndex + 1);

                    sDecimalPart = sDecimalPart.replace(/\./g, "");
                    sDecimalPart = sDecimalPart.substring(0, 2);

                    sValue = sIntegerPart + "." + sDecimalPart;
                }

                // Remove leading zeros
                if (sValue.includes(".")) {
                    var aParts = sValue.split(".");
                    aParts[0] = aParts[0].replace(/^0+(?=\d)/, "");
                    sValue = aParts[0] + "." + aParts[1];
                } else {
                    sValue = sValue.replace(/^0+(?=\d)/, "");
                }

                oControl.setValue(sValue);

                // Get the property name from the binding
                var sBindingPath = oControl.getBindingPath("value");

                var aCalculationFields = [
                    "Accural_Basis",
                    "Discharge_Liabilty",
                    "Cash_Basis",
                    "Idc",
                    "Admitted_Cost"
                ];

                if (!aCalculationFields.includes(sBindingPath)) {
                    return;
                }

                // Update model
                var oContext = oControl.getBindingContext("viewModel");

                if (oContext) {
                    oContext.getModel().setProperty(
                        oContext.getPath() + "/" + sBindingPath,
                        sValue
                    );
                }

                // Debounce
                clearTimeout(this._decimalChangeTimer);

                this._decimalChangeTimer = setTimeout(function () {
                    this._calculateForm9ATotals(sBindingPath);
                }.bind(this), 700);
            },

            _calculateForm9ATotals: function (sField) {
                const oViewModel = this.getModel("viewModel");
                const aForm9A = oViewModel.getProperty("/catalog/Form9A") || [];

                let fGrandTotal = 0;

                aForm9A.forEach(function (oSection) {
                    if (oSection.Sno === "0004") {
                        return;
                    }

                    const aChildren = oSection.Form9Ahead_9AItem || [];
                    let fSubtotal = 0;

                    aChildren.forEach(function (oChild) {
                        if (oChild.isSubtotal || oChild.isTotal) {
                            return;
                        }

                        const fValue = parseFloat(oChild[sField]);

                        if (!isNaN(fValue)) {
                            fSubtotal += fValue;
                        }
                    });

                    const oSubtotal = aChildren.find(function (oChild) {
                        return oChild.isSubtotal === true;
                    });

                    if (oSubtotal) {
                        oSubtotal[sField] = fSubtotal.toFixed(2);
                    }

                    fGrandTotal += fSubtotal;
                });

                const oTotalSection = aForm9A.find(function (oSection) {
                    return oSection.Sno === "0004";
                });

                if (oTotalSection) {
                    const oTotalRow = (oTotalSection.Form9Ahead_9AItem || []).find(function (oChild) {
                        return oChild.isTotal === true;
                    });

                    if (oTotalRow) {
                        oTotalRow[sField] = fGrandTotal.toFixed(2);
                    }
                }

                oViewModel.setProperty("/catalog/Form9A", aForm9A);
            }

        });
    });