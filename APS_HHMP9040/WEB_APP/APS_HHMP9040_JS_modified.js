<script>

    var vm = new Vue({
            el: "#contents",
            i18n: gI18n,
            data: function () {
                return {
                    local: localStorage.getItem("languageCode"),
                    mUserId: authentication.getUsername(),
                    lPlant: gI18n.tc("PLANT"),
                    tSearch: gI18n.tc("SEARCH"),
                    mArrPlantInfo: [],
                    mPlantId: "",
                    mPlantName: "",
                    sPlantId: "",
                    sResourceCode: "",
                    exportGrd1: {
                        grid: null,
                        headerDepth: 1,
                        footer: "default",
                        allColumns: true,
                        lookupDisplay: false,
                        separateRows: false
                    }
                };
            },
            methods: {
                loadPlantInfo: function () {
                    axios({
                        method: "post",
                        headers: {"content-type": "application/json"},
                        url: BASE_URL + "hhmp/common/plant-info"
                    }).then(function (response) {
                        if (response.status === gHttpStatus.SUCCESS && response.data.length > 0) {
                            vm.mArrPlantInfo = response.data;
                        }

                        for (var i = 0, len = vm.mArrPlantInfo.length; i < len; i++) {
                            var plantInfo = vm.mArrPlantInfo[i];

                            if (plantInfo.plantId.toString() === "4203") {
                                vm.mPlantId = plantInfo.plantId;
                                vm.mPlantName = plantInfo.plantName;
                                var plantNameElement = document.getElementById("plant_name");

                                if (plantNameElement) {
                                    plantNameElement.disabled = true;
                                    plantNameElement.style.background = "#F0F0F0";
                                }

                                break;
                            }
                        }

                        vm.doLoadDropDown(getComboListParamMap(
                            {
                                CODE_TYPE: "CODE_MST",
                                FIRST_YN: "N",
                                FIRST_TYPE: "",
                                PARAM01: vm.mPlantId,
                                PARAM02: "UOM",
                                PARAM03: "Y",
                                PARAM04: "Y"
                            }),
                            "capaUom");
                        vm.doLoadDropDown(getComboListParamMap(
                            {
                                CODE_TYPE: "CODE_MST",
                                FIRST_YN: "N",
                                FIRST_TYPE: "",
                                PARAM01: vm.mPlantId,
                                PARAM02: "RES_TYPE1",
                                PARAM03: "Y",
                                PARAM04: "Y"
                            }),
                            "resourceType1");
                    }).catch(function (err) {
                        console.warn(err);
                    });
                },
                doLoadDropDown: function (params, columnName) {
                    var rComboListData = [];
                    axios({
                        method: "post",
                        headers: {"content-type": "application/json"},
                        url: BASE_URL + "hhmp/common/combo-list",
                        params: getComboListParamMap(params)
                    }).then(function (response) {
                        if (response.status === gHttpStatus.SUCCESS && response.data.length > 0) {
                            rComboListData = response.data;
                        }
                    }).catch(function (err) {
                        console.log(err);
                    }).then(function () {
                        var values = [];
                        var labels = [];

                        for (var i = 0, len = rComboListData.length; i < len; i++) {
                            var row = rComboListData[i];

                            values.push(row.code);
                            labels.push(row.codeName);
                        }

                        var column = vm.$grd1.gridView.columnByName(columnName);
                        column.values = values;
                        column.labels = labels;
                        vm.$grd1.gridView.setColumn(column);
                    });
                },
                insertRowGrd1: function () {
                    var gridView = this.$grd1.gridView;
                    var dataProvider = this.$grd1.dataProvider;
                    gridView.commit();

                    dataProvider.insertRow(0, []);

                    gridView.setValue(0, "plantId", vm.sPlantId ? vm.sPlantId : vm.mPlantId);
                    gridView.setValue(0, "useYn", "Y");
                    gridView.setValue(0, "capaNtrgtYn", "Y");

                    this.mInsertRowEnable = true;
                    gSetEditableColumns(vm.$grd1, 0, ["resourceCode"], true);
                },
                deleteRowGrd1: function () {
                    var gridView = this.$grd1.gridView;
                    var dataProvider = gridView.getDataSource();
                    var checkedRows = gridView.getCheckedRows(true);

                    if (checkedRows.length <= 0) {
                        showDialog(gI18n.tc("INFO"), gI18n.tc("MSG_APS_5015"), DIALOG_TYPE.INFO);
                    } else {
                        showDialog(gI18n.tc("DELETE"), gI18n.tc("MSG_DELETE"), DIALOG_TYPE.CONFIRM).then(
                            function (answer) {
                                if (answer) {
                                    for (var i = 0, len = checkedRows.length; i < len; i++) {
                                        dataProvider.removeRow(checkedRows[i]);
                                    }
                                }
                            }
                        );
                    }
                },
                loadGrd1: function () {
                    var gridView = this.$grd1.gridView;
                    var dataProvider = this.$grd1.dataProvider;
                    gridView.commit(true);

                    if (isGridUpdated(dataProvider)) {
                        showDialog(gI18n.tc("WARNING"), gI18n.tc("MSG_APS_5001") + "<br>" + gI18n.tc("MSG_APS_5002"), DIALOG_TYPE.CONFIRM).then(
                            function (answer) {
                                if (answer) {
                                    vm.loadGrd1Actual(gridView, dataProvider);
                                }
                            }
                        );
                    } else {
                        vm.loadGrd1Actual(gridView, dataProvider);
                    }
                },
                loadGrd1Actual: function (gridView, dataProvider) {
                    gridView.showToast(progressSpinner + "Loading data...", true);

                    axios({
                        method: "post",
                        headers: {"content-type": "application/json"},
                        url: BASE_URL + "hhmp1040m/demand/q1",
                        params: {
                            PLANT_ID: vm.mPlantId
                        }
                    }).then(function (response) {
                        dataProvider.clearRows();

                        if (response.status === gHttpStatus.SUCCESS && response.data.length > 0) {
                            vm.mGrd1Data = response.data;
                            vm.setDataGrd1(gridView, vm.mGrd1Data);
                        }

                        gridView.hideToast();

                    }).catch(function (err) {
                        console.warn(err);
                    });
                },

                // data 저장 공간
                setDataGrd1: function (gridView, responseData) {

                    var dataProvider = gridView.getDataSource();
                    var result = [];

                    responseData.map(function (dataRow) {
                        var obj = {};
                        obj["plantId"] = dataRow["plantId"];
                        obj["resourceCode"] = dataRow["resourceCode"];
                        obj["resourceName"] = dataRow["resourceName"];
                        obj["capaNtrgtYn"] = dataRow["capaNtrgtYn"];
                        obj["baseManpower"] = dataRow["baseManpower"];
                        obj["baseWorkMh"] = dataRow["baseWorkMh"];
                        obj["baseOperRat"] = dataRow["baseOperRat"];
                        obj["baseEfcyRat"] = dataRow["baseEfcyRat"];
                        obj["baseExtrawkRat"] = dataRow["baseExtrawkRat"];
                        obj["baseCapa"] = dataRow["baseCapa"];
                        obj["capaUom"] = dataRow["capaUom"];
                        obj["resourceType1"] = dataRow["resourceType1"];
                        obj["sortSeq"] = dataRow["sortSeq"];
                        obj["useYn"] = dataRow["useYn"];

                        result.push(obj);
                    });

                    dataProvider.fillJsonData(result, {count: -1});

                    if (dataProvider.getRowCount() > 0) {
                        vm.sPlantId = gridView.getValue(0, "plantId");
                    }
                },
                saveGrd1: function () {
                    var gridView = this.$grd1.gridView;
                    gridView.commit();

                    var dataProvider = this.$grd1.dataProvider;
                    var stagedRows = getStagedRows(dataProvider);

                    // if (!checkUserPermission(gOperationType.UPDATE)) {
                    //     return;
                    // }

                    if (stagedRows.length <= 0) {
                        showDialog(gI18n.tc("INFO"), gI18n.tc("MSG_5039"), DIALOG_TYPE.INFO);

                    } else {
                        var params = [];

                        for (var i = 0, len = stagedRows.length; i < len; i++) {
                            var stagedRow = stagedRows[i];

                            var resourceCode = stagedRow.resourceCode;

                            if (!resourceCode) {
                                showDialog(gI18n.tc("ALERT"), gI18n.tc("MSG_0006"), DIALOG_TYPE.ALERT);
                                return;
                            } else {
                                var paramRow = {};

                                paramRow["actionFlg"] = stagedRow.actionFlag;
                                paramRow["plantId"] = stagedRow.plantId;
                                paramRow["resourceCode"] = stagedRow.resourceCode;
                                paramRow["resourceName"] = stagedRow.resourceName;
                                paramRow["capaNtrgtYn"] = stagedRow.capaNtrgtYn;
                                paramRow["baseManpower"] = stagedRow.baseManpower;
                                paramRow["baseWorkMh"] = stagedRow.baseWorkMh;
                                paramRow["baseOperRat"] = stagedRow.baseOperRat;
                                paramRow["baseEfcyRat"] = stagedRow.baseEfcyRat;
                                paramRow["baseExtrawkRat"] = stagedRow.baseExtrawkRat;
                                paramRow["baseCapa"] = stagedRow.baseCapa;
                                paramRow["capaUom"] = stagedRow.capaUom;
                                paramRow["resourceType1"] = stagedRow.resourceType1;
                                paramRow["sortSeq"] = stagedRow.sortSeq;
                                paramRow["useYn"] = stagedRow.useYn;
                                paramRow["userId"] = vm.mUserId;

                                params.push(paramRow);
                            }
                        }

                        showDialog(gI18n.tc("SAVE"), gI18n.tc("MSG_SAVE"), DIALOG_TYPE.CONFIRM).then(
                            function (answer) {
                                if (answer) {
                                    gridView.showToast(progressSpinner + "Saving data...", true);

                                    axios({
                                        method: "post",
                                        url: BASE_URL + "hhmp1040m/demand/s1",
                                        headers: {"content-type": "application/json"},
                                        data: params
                                    }).then(function (response) {
                                        if (response.status === gHttpStatus.SUCCESS) {
                                            if (response.data.success) {
                                                showDialog(gI18n.tc("INFO"), gI18n.tc(response.data.message), DIALOG_TYPE.INFO, true);
                                                dataProvider.clearRowStates(true, false);
                                                vm.loadGrd1();
                                            } else {
                                                showDialog(gI18n.tc("WARNING"), gI18n.tc(response.data.message), DIALOG_TYPE.ALERT, true);
                                            }
                                        }

                                        gridView.hideToast();
                                    }).catch(function (err) {
                                        console.log(err);
                                    });
                                }
                            }
                        );
                    }
                },

                doResize: function () {
                    if (this.$grd1 !== undefined) {
                        this.$grd1.gridView.resetSize();
                    }
                },
                createGrd1: function () {

                    var aColumnProps = [
                        {name: "plantId", dataType: "text", visible: false, editable: false, width: 100}
                    ];

                    var resourceColumnProps = [
                        {name: "resourceCode", dataType: "text", visible: true, editable: false, width: 100, headerText: "COMN_CD"},
                        {name: "resourceName", dataType: "text", visible: true, editable: true, width: 100, headerText: "RESOURCE_NM"}
                    ];

                    var bColumnProps = [
                        {name: "capaNtrgtYn", dataType: "boolean", visible: true, editable: true, width: 100, headerText: "CAPA_YN"},
                        {name: "baseManpower", dataType: "number", visible: true, editable: true, width: 100, format: "#,###", headerText: "PERSONNEL"},
                        {name: "baseWorkMh", dataType: "number", visible: true, editable: true, width: 100, format: "#,###.0", headerText: "OPERTN_TIME"},
                        {name: "baseOperRat", dataType: "number", visible: true, editable: true, width: 100, format: "#,###.0", headerText: "EFFECTIVE_OPERATION_RATE"},
                        {name: "baseEfcyRat", dataType: "number", visible: true, editable: true, width: 100, format: "#,###.0", headerText: "EFFICY"},
                        {name: "baseExtrawkRat", dataType: "number", visible: true, editable: true, width: 100, format: "#,###.0", headerText: "OVERTIME_RATE"},
                        {name: "baseCapa", dataType: "number", visible: true, editable: false, width: 100, format: "#,###.###", headerText: "CAPA"},
                        {name: "capaUom", dataType: "text", visible: true, editable: true, width: 100, headerText: "UOM", useDropdown: true},
                        {name: "resourceType1", dataType: "text", visible: true, editable: true, width: 100, headerText: "TYPE", useDropdown: true},
                        {name: "sortSeq", dataType: "number", visible: true, editable: true, width: 100, headerText: "SEARCH_ORDER"},
                        {name: "useYn", dataType: "boolean", visible: true, editable: true, width: 100, headerText: "USE_YN"}
                    ];

                    var aFields = setFieldsProps(aColumnProps);
                    var resourceFields = setFieldsProps(resourceColumnProps);
                    var bFields = setFieldsProps(bColumnProps);

                    var baseCapaIdx = findWithAttr(bFields, "fieldName", "baseCapa")

                    bFields[baseCapaIdx].calculateCallback = function (dataRow, fieldName, fieldNames, values) {
                        var capaNtrgtYn = values[fieldNames.indexOf("capaNtrgtYn")];

                        var baseManpower = !isNaN(values[fieldNames.indexOf("baseManpower")]) ? values[fieldNames.indexOf("baseManpower")] : 0;// 인원
                        var baseWorkMh = !isNaN(values[fieldNames.indexOf("baseWorkMh")]) ? values[fieldNames.indexOf("baseWorkMh")] : 0;// 가동시간
                        var baseOperRat = !isNaN(values[fieldNames.indexOf("baseOperRat")]) ? values[fieldNames.indexOf("baseOperRat")] : 0;// 유효가동율
                        var baseEfcyRat = !isNaN(values[fieldNames.indexOf("baseEfcyRat")]) ? values[fieldNames.indexOf("baseEfcyRat")] : 0;// 효율
                        var baseExtrawkRat = !isNaN(values[fieldNames.indexOf("baseExtrawkRat")]) ? values[fieldNames.indexOf("baseExtrawkRat")] : 0;// 잔업율

                        if (capaNtrgtYn) {
                            return 99999;
                        } else {
                            return Math.round(baseManpower * (baseWorkMh + (baseWorkMh * (baseExtrawkRat / 100))) * (baseOperRat / 100) * (baseEfcyRat / 100));
                        }
                    };

                    var columnProps = aColumnProps;
                    columnProps = columnProps.concat(resourceColumnProps);
                    columnProps = columnProps.concat(bColumnProps);

                    var aColumns = setColumnsProps(aColumnProps);
                    var resourceColumns = setColumnsProps(resourceColumnProps);
                    var bColumns = setColumnsProps(bColumnProps);

                    var gColumnResource = createGroupColumn("gColumnResource", "horizontal", "RESOURCE_NAME", true, resourceColumns, false);

                    var fields = [];
                    fields = fields.concat(aFields);
                    fields = fields.concat(resourceFields);
                    fields = fields.concat(bFields);

                    var columns = [];
                    columns = columns.concat(aColumns);
                    columns.push(gColumnResource);
                    columns = columns.concat(bColumns);


                    this.$grd1 = this.$createGrid("grd1", fields, columns);
                    var grd1 = this.$grd1;
                    var gridView = grd1.gridView;
                    var dataProvider = gridView.getDataSource();
                    gridView.columnProps = columnProps;
                    grd1.gStyle = setStyleProps(true, true, true);

                    gInitStyle(grd1);
                    gSetOptions(grd1);
                    setGridContextMenu(gridView);

                    gridView.setHeader({height: 50});

                    gridView.setOptions({
                        hideDeletedRows: true
                    });

                    dataProvider.setOptions({
                        restoreMode: "auto",
                        softDeleting: true
                    });

                    gridView.setSelectOptions({
                        style: "block"
                    });

                    gridView.setCopyOptions({
                        singleMode: false
                    });

                    gridView.setDisplayOptions({
                        fitStyle: "none"
                    });

                    gridView.setEditOptions({
                        insertable: true,
                        appendable: true,
                        deletable: true
                    });

                    var dColumnNames = ["baseManpower", "baseWorkMh", "baseOperRat", "baseEfcyRat", "baseExtrawkRat"];

                    for (var i = 0, len = dColumnNames.length; i < len; i++) {
                        var columnName = dColumnNames[i];

                        gridView.setColumnProperty(columnName, "dynamicStyles", function (grid, index, value) {
                            var itemIndex = index.itemIndex;
                            var rstStyle = {};

                            var capaNtrgtYn = grid.getValue(itemIndex, "capaNtrgtYn");

                            if (capaNtrgtYn) {
                                rstStyle.editable = false;
                                rstStyle.background = "#FFF9F9F9";
                            } else {
                                rstStyle.background = "#FFFFFFD2";
                                rstStyle.editable = true;
                            }

                            return rstStyle;
                        });
                    }


                    gridView.onEditCommit = function (grid, index, oldValue, newValue) {
                        if (index.fieldName === "resourceCode") {
                            vm.oldResourceCode = oldValue;
                        }
                    };

                    gridView.onCellEdited = function (grid, itemIndex, dataRow, field) {
                        gridView.commit();
                        var dataProvider = grid.getDataSource();
                        var fieldName = dataProvider.getOrgFieldName(field);

                        if (fieldName === "capaNtrgtYn") {
                            var editedValue = dataProvider.getValue(dataRow, fieldName);

                            if (editedValue) {
                                dataProvider.setValue(dataRow, "baseManpower" , null);
                                dataProvider.setValue(dataRow, "baseWorkMh" , null);
                                dataProvider.setValue(dataRow, "baseOperRat" , null);
                                dataProvider.setValue(dataRow, "baseEfcyRat" , null);
                                dataProvider.setValue(dataRow, "baseExtrawkRat" , null);
                                gridView.commit();
                            }
                        } else if (fieldName === "resourceCode") {
                            var resourceCodeValues = dataProvider.getFieldValues("resourceCode");
                            var editedValue = dataProvider.getValue(dataRow, fieldName);

                            resourceCodeValues.splice(dataRow, 1);

                            if (resourceCodeValues.includes(editedValue)) {
                                // MSG_APS_5031 : 중복된 리소스 코드가 존재합니다.
                                showDialog(gI18n.tc("ALERT"), gI18n.tc("MSG_APS_5031"), DIALOG_TYPE.ALERT);
                                dataProvider.setValue(dataRow, fieldName, vm.oldResourceCode);
                            }
                        }
                    };
                }
            },
            mounted: function () {
                this.createGrd1();
                this.exportGrd1.grid = Object.freeze(this.$grd1);
                this.$grd1.gridView.exportSetting = "exportGrd1";

                this.loadPlantInfo();
            },
            updated: function () {
                vm.doResize();
            },
            watch: {
            }
        });
</script>

