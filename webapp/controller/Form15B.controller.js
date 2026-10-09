sap.ui.define([
	"com/nhpc/zsdtarifformss1/controller/BaseController",
	"com/nhpc/zsdtarifformss1/util/messenger",
	"com/nhpc/zsdtarifformss1/util/formatter",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, messenger, formatter, BusyIndicator, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend(
		"com.nhpc.zsdtarifformss1.controller.Form15B",
		{

			formatter: formatter,

			onInit: function () {

				this.oItemsProcessor = [];

				this.getRouter().getRoute("RouteForm15B").attachPatternMatched(this._onRoutePatternMatched, this);
			},

			onAfterRendering: function () {

				this.getView().addStyleClass("sapUiSizeCompact");
			},


			_onRoutePatternMatched: function (oEvent) {

				const oViewModel = this.getModel("viewModel");
				const oArgs = oEvent.getParameter("arguments");

				oViewModel.setProperty("/attachmentList", []);
				

				const sStatus = oArgs.Status;
				const sSelectedYear = oArgs.Fisical_Year;
				const sTariffID = oArgs.tariffId;
				const sFormID = oArgs.formId;

				this._FiscalYear = sSelectedYear;
				this._TariffID = sTariffID;
				this._FormID = sFormID;

				oViewModel.setProperty("/Status", sStatus);

				// this.getAttachments();

				oViewModel.setProperty("/canEdit", sStatus !== "Submitted");

				if (sStatus === "NEW") {
					this._loadInitialForm15BData();
				} else {
					this._loadForm15BData();
				}
			},
			_loadInitialForm15BData: function () {
				const oModel = this.getModel();
				const oViewModel = this.getModel("viewModel");
				var sPlant = oViewModel.getProperty("/Header/Plant");

				const aFilters = [
					new Filter("Form_id", FilterOperator.EQ, this._FormID),
					new Filter("Plant", FilterOperator.EQ, sPlant)
				];

				BusyIndicator.show();

				oModel.read("/Form15BGetSet", {
					filters: aFilters,

					success: function (oData) {
						BusyIndicator.hide();

						console.log("Form 15B NEW GET response:", oData);

						const aItems = oData.results || [];

						oViewModel.setProperty("/Form15B/Items", aItems);

						console.log("Form 15B initial items:", oViewModel.getProperty("/Form15B/Items"));
					}.bind(this),

					error: function (oError) {
						BusyIndicator.hide();
						console.error("Form 15B NEW GET error:", oError);
					}
				});
			},
			_loadForm15BData: function () {
				const oModel = this.getModel();
				const oViewModel = this.getModel("viewModel");

				const aFilters = [
					new Filter("Tarrif_id", FilterOperator.EQ, this._TariffID),
					new Filter("Form_id", FilterOperator.EQ, this._FormID)
				];

				BusyIndicator.show(0);

				oModel.read("/Form15BHeadSet", {
					filters: aFilters,

					urlParameters: {
						"$expand": "Form15Bheaditem"
					},

					success: function (oData) {
						BusyIndicator.hide();

						console.log("Form 15B GET response:", oData);

						if (oData.results && oData.results.length > 0) {

							const oHeader = oData.results[0];

							const aItems = oHeader.Form15Bheaditem && oHeader.Form15Bheaditem.results ? oHeader.Form15Bheaditem.results : [];

							oViewModel.setProperty("/Form15B", {
								Company: oHeader.Company || "",
								Generating_Station: oHeader.Generating_Station || "",
								Installed_Capacity: oHeader.Installed_Capacity || "",
								Status: oHeader.Status || "",
								Remarks: oHeader.Remarks || "",
								Items: aItems
							});

							console.log("Form 15B mapped data:", oViewModel.getProperty("/Form15B"));

						} else {

							// No saved Form 15B record.
							// This is a new form, so initialize the table structure.


						}

					}.bind(this),

					error: function (oError) {
						BusyIndicator.hide();

						console.error("Form 15B GET error:", oError);
					}.bind(this)
				});
			},


			handleSaveBtnPress: function () {

				const oModel = this.getModel();
				const oResourceBundle =
					this.getResourceBundle();

				const aPayload =
					this.getPayload("Draft");

				messenger.confirm(
					oResourceBundle.getText("CONFIRM_TITLE"),
					"Do you want to save Form 15B as Draft?",
					"Confirm",
					null,
					function () {

						BusyIndicator.show(0);

						oModel.create(
							"/Form15BSet",
							aPayload,
							{

								success: function () {

									BusyIndicator.hide();

									messenger.success(
										"Form 15B saved successfully",
										function () {

											this.getRouter().navTo(
												"RouteDetail",
												{
													tariffId:
														this._TariffID
												},
												{},
												true
											);

										}.bind(this)
									);

								}.bind(this),

								error: function (oError) {

									BusyIndicator.hide();

									let sMessage =
										"Unable to save Form 15B";

									try {
										sMessage =
											JSON.parse(
												oError.responseText
											).error.message.value;
									} catch (e) {
										// keep default message
									}

									messenger.error(
										sMessage
									);
								}.bind(this)
							}
						);

					}.bind(this)
				);
			},


			handleSubmitBtnPress: function () {

				const oModel = this.getModel();
				const oResourceBundle =
					this.getResourceBundle();

				const aPayload =
					this.getPayload("Submitted");

				messenger.confirm(
					oResourceBundle.getText("CONFIRM_TITLE"),
					"Do you want to submit Form 15B?",
					"Confirm",
					null,
					function () {

						BusyIndicator.show(0);

						oModel.create(
							"/Form15BSet",
							aPayload,
							{

								success: function () {

									BusyIndicator.hide();

									messenger.success(
										"Form 15B submitted successfully",
										function () {

											this.getRouter().navTo(
												"RouteDetail",
												{
													tariffId:
														this._TariffID
												},
												{},
												true
											);

										}.bind(this)
									);

								}.bind(this),

								error: function (oError) {

									BusyIndicator.hide();

									let sMessage =
										"Unable to submit Form 15B";

									try {
										sMessage =
											JSON.parse(
												oError.responseText
											).error.message.value;
									} catch (e) {
										// keep default message
									}

									messenger.error(
										sMessage
									);
								}.bind(this)
							}
						);

					}.bind(this)
				);
			},


			getPayload: function (sStatus) {

				const oViewModel =
					this.getModel("viewModel");

				const oForm15B =
					oViewModel.getProperty(
						"/Form15B"
					) || {};

				const aItems =
					oForm15B.Items || [];

				const aForm15BItems =
					aItems.map(function (oItem, index) {

						return {

							Sno: String(index + 1)
								.padStart(3, "0"),

							Month:
								oItem.Month,

							Sequence:
								oItem.Sequence,

							Design_Energy:
								oItem.Design_Energy,

							MW_Continuous:
								oItem.MW_Continuous
						};
					});

				return {

					Fiscal_year:
						this._FiscalYear,

					Tarrif_id:
						this._TariffID,

					Form_id:
						"15B",

					Status:
						sStatus,

					Company:
						oForm15B.Company,

					Generating_Station:
						oForm15B.Generating_Station,

					Installed_Capacity:
						oForm15B.Installed_Capacity,

					Remarks:
						oForm15B.Remarks,

					Form15BItem:
						aForm15BItems
				};
			}

		}
	);
});