sap.ui.define([
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/IconPool"

], function (DateFormat, IconPool) {
    "use strict";

    return {
       
        formatDate: function (sValue) {

            if (!sValue) {
                return "";
            }

            // YYYY-MM-DD
            if (typeof sValue === "string" && sValue.indexOf("-") > -1) {

                var aParts = sValue.split("-");

                return aParts[2] + "." +
                    aParts[1] + "." +
                    aParts[0];
            }

            // YYYYMMDD
            if (typeof sValue === "string" && sValue.length === 8) {

                return sValue.substring(6, 8) + "." +
                    sValue.substring(4, 6) + "." +
                    sValue.substring(0, 4);
            }

            // Date Object
            if (sValue instanceof Date) {

                var dd = String(sValue.getDate()).padStart(2, "0");
                var mm = String(sValue.getMonth() + 1).padStart(2, "0");
                var yyyy = sValue.getFullYear();

                return dd + "." + mm + "." + yyyy;
            }

            return sValue;
        },
        formatStatusText: function (sStatus) {

            if (!sStatus) {
                return "";
            }

            switch (sStatus.toUpperCase()) {

                case "D":
                    return "Draft";

                case "S":
                    return "Saved";

                case "U":
                    return "Submitted";

                case "N":
                    return "Recommended";

                case "A":
                    return "Approved";

                case "Z":
                    return "Authorized";

                case "R":
                    return "Rejected";

                case "T":
                    return "Returned";

                case "W":
                    return "New";

                default:
                    return sStatus;
            }
        },

        formatStatusState: function (sStatus) {

            if (!sStatus) {
                return "None";
            }

            switch (sStatus.toUpperCase()) {

                case "NEW":
                case "CONFIRM":
                case "CONFIRMED":
                    return "Information";

                case "DRAFT":
                case "PENDING":
                    return "Warning";

                case "SUBMIT":
                case "SUBMITTED":
                case "APPROVE":
                case "APPROVED":
                    return "Success";

                case "REJECT":
                case "REJECTED":
                    return "Error";

               
                case "RETURN":
                case "RETURNED":
                    return "Warning";

                default:
                    return "Information";
            }
        },

        formatHistoryDateTime: function (oDate, oTime) {

            if (!oDate || !oTime) {
                return "";
            }

            // Convert Date "YYYYMMDD"
            var year = oDate.substring(0, 4);
            var month = oDate.substring(4, 6);
            var day = oDate.substring(6, 8);

            var oJSDate = new Date(year, month - 1, day);

            var sDate =
                String(oJSDate.getDate()).padStart(2, "0") + "." +
                String(oJSDate.getMonth() + 1).padStart(2, "0") + "." +
                oJSDate.getFullYear();

            var iHours = 0, iMinutes = 0, iSeconds = 0;


            if (typeof oTime === "string") {

                var match = oTime.match(/PT(\d+)H(\d+)M(\d+)S/);

                if (match) {
                    iHours = parseInt(match[1], 10);
                    iMinutes = parseInt(match[2], 10);
                    iSeconds = parseInt(match[3], 10);
                }

            }

            else if (oTime.ms !== undefined) {

                var iTotalSeconds = Math.floor(oTime.ms / 1000);

                iHours = Math.floor(iTotalSeconds / 3600);
                iMinutes = Math.floor((iTotalSeconds % 3600) / 60);
                iSeconds = iTotalSeconds % 60;
            }

            var sTime =
                String(iHours).padStart(2, "0") + ":" +
                String(iMinutes).padStart(2, "0") + ":" +
                String(iSeconds).padStart(2, "0");

            return sDate + " " + sTime;
        },
        formatAttachmentIcon: function (mime) {
            if (mime !== null || mime !== "") {
                return sap.ui.core.IconPool.getIconForMimeType(mime);
            }
        },


    };
});