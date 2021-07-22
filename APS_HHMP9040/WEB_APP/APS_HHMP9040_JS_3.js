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
                tSave: gI18n.tc("SAVE"),
                // sPlantId: "",
                sGrpCode: "",
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

                    // code -- 4203 경로 지정
                    url: BASE_URL + "hhmp/common/plant-info"

                }).then(function (response) {
                    if (response.status === gHttpStatus.SUCCESS && response.data.length > 0) {
                        vm.mArrPlantInfo = response.data;
                    }
                }).catch(function (err) {
                    console.warn(err);
                }).finally(function () {
                    for (var i = 0, len = vm.mArrPlantInfo.length; i < len; i++) {
                        var plantInfo = vm.mArrPlantInfo[i];

                        // 4203 : 고압전동기 text 자동 셋팅
                        if (plantInfo.plantId.toString() === "4203") {
                            vm.mPlantId = plantInfo.plantId;
                            vm.mPlantName = plantInfo.plantName;
                            var plantNameElement = document.getElementById("plant_name");

                            // plantName input_style 속성 정의
                            if (plantNameElement) {
                                plantNameElement.disabled = true;
                                plantNameElement.style.background = "#F0F0F0";
                            }

                            break;
                        }
                    }
                    //////// DropDown list
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
                });
            },
            // Grid 내 콤보
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

            /*
            // Plus button click -> ROW 추가
            insertRowGrd1: function () {
                var gridView = this.$grd1.gridView;
                var dataProvider = this.$grd1.dataProvider;
                gridView.commit();

                dataProvider.insertRow(0, []);

                gridView.setValue(0, "plantId", vm.sPlantId ? vm.sPlantId : vm.mPlantId);
                gridView.setValue(0, "workyn", true);
            },
            */
            insertRowGrd1: function () {
                var gridView = this.$grd1.gridView;
                var dataProvider = this.$grd1.dataProvider;

                dataProvider.insertRow(0, []);

                // if (this.$grd1.dataProvider.getRowCount() > 0) {
                //     this.$grd1.dataProvider.insertRow(
                //         this.$grd1.gridView.getCurrent().dataRow + 1, []
                //     ); //insert below row
                //     this.$grd1.gridView.commit(true);
                // } else {
                //     this.$grd1.gridView.beginAppendRow(0);
                //     this.$grd1.gridView.commit(true);
                // }
                //////////////// To edit the function of adding rows 
                gridView.setValue(0, "useYn", "Y");
                gridView.setValue(0, "capantrgtyn", "Y");
                
                gSetEditableColumns(vm.$grd1, 0,["resourceCode"],true);

                // gSetEditableColumns(vm.$grd1, 0,
                //     ["resourceCode",
                //         "resourceName",
                //         "capantrgtyn",
                //         "baseManpower",
                //         "baseWork",
                //         "baseOperRat",
                //         "baseEfcyRat",
                //         "baseExtrawkRat",
                //         "capaUom",
                //         "resourceType1",
                //         "sortSeq",
                //         "useYn"],
                //     true);

                // if (dataProvider.getValue(this.$grd1.gridView.getCurrent().dataRow + 1, "capantrgtyn") === "Y") {
                //     gSetEditableColumns(vm.$grd1, this.$grd1.gridView.getCurrent().dataRow + 1, ["baseManpower", "baseWork", "baseOperRat", "baseEfcyRat", "baseExtrawkRat"], false);
                // } else
                //     gSetEditableColumns(vm.$grd1, this.$grd1.gridView.getCurrent().dataRow + 1, ["baseManpower", "baseWork", "baseOperRat", "baseEfcyRat", "baseExtrawkRat"], true);
                //
                // gSetEditableColumns(vm.$grd1, this.$grd1.gridView.getCurrent().dataRow + 1, ["resourceCode",], true);
            },

            // Minus button click -> ROW 삭제
            deleteRowGrd1: function () {
                var gridView = this.$grd1.gridView;
                var checkedIndexes = gridView.getCheckedItems();

                if (!checkedIndexes.length) {
                    showDialog(
                        "Alert",
                        "Please select the rows to delete.",
                        DIALOG_TYPE.CONFIRM
                    );
                } else {
                    showDialog(
                        "Delete",
                        "Are you sure to Delete?",
                        DIALOG_TYPE.CONFIRM
                    ).then(function (answer) {
                        if (answer) {
                            var deleteList = [];
                            checkedIndexes.forEach(function (index) {
                                var deleteObject = {
                                    resourceCode: gridView.getValue(index, "resourceCode"),
                                    plantId: vm.mPlantId,
                                    actionFlg: 'D'
                                };

                                deleteList.push(deleteObject);
                            });

                            gridView.showToast(progressSpinner + "Deleting data...", true);

                            axios({
                                method: "post",
                                url: BASE_URL + "hhmp1040m/demand/s1",
                                headers: {"content-type": "application/json"},
                                data: deleteList
                            }).then(function (response) {
                                if (response.status === gHttpStatus.SUCCESS) {
                                    vm.$grd1.dataProvider.removeRows(checkedIndexes);
                                }
                            }).catch(function (err) {
                                console.log(err);
                            }).finally(function () {
                                gridView.hideToast();
                                vm.loadGrd1();
                            });
                        }
                    });
                }
            },

            // Search button click -> 검색조건에 해당하는 내용 조회
            loadGrd1: function () {
                var gridView = this.$grd1.gridView;
                var dataProvider = this.$grd1.dataProvider;
                gridView.commit(true);

                // grd 수정 중 해당 화면을 벗어나려할 경우 warnMsg
                var updatedGrd = [];

                if (isGridUpdated(dataProvider)) {
                    updatedGrd.push("HEAD");
                }

                // MSG_APS_5001 : 저장되지 않은 데이터가 있습니다.
                // MSG_APS_5002 : 계속하시겠습니까?
                var warnMsg = gI18n.tc("MSG_APS_5001") + "<br>" + updatedGrd.join(", ") + "<br>" + gI18n.tc("MSG_APS_5002");

                if (updatedGrd.length > 0) {
                    showDialog(gI18n.tc("WARNING"), warnMsg, DIALOG_TYPE.CONFIRM).then(
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

            // Search button click -> 데이터베이스에서 가져온 데이터 확인 및 조회
            loadGrd1Actual: function (gridView, dataProvider) {
                gridView.showToast(progressSpinner + "Loading data...", true);

                axios({
                    method: "post",
                    headers: {"content-type": "application/json"},

                    // url 재설정 해야되는 곳.
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

                }).catch(function (err) {
                    console.warn(err);

                }).finally(function () {
                    gridView.hideToast();
                });
            },

            // data 저장 공간
            setDataGrd1: function (gridView, responseData) {

                var dataProvider = gridView.getDataSource();
                var result = [];

                responseData.map(function (dataRow) {
                    var obj = {};
                    obj["resourceCode"] = dataRow["resourceCode"];
                    obj["resourceName"] = dataRow["resourceName"];
                    obj["capantrgtyn"] = dataRow["capantrgtyn"];
                    obj["baseManpower"] = dataRow["baseManpower"];
                    obj["baseWork"] = dataRow["baseWork"];
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

            },

            // Save button click -> 데이터 저장
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

                            paramRow["resourceCode"] = stagedRow.resourceCode;
                            paramRow["resourceName"] = stagedRow.resourceName;
                            paramRow["capantrgtyn"] = stagedRow.capantrgtyn;
                            paramRow["baseManpower"] = stagedRow.baseManpower;
                            paramRow["baseWork"] = stagedRow.baseWork;
                            paramRow["baseOperRat"] = stagedRow.baseOperRat;
                            paramRow["baseEfcyRat"] = stagedRow.baseEfcyRat;
                            paramRow["baseExtrawkRat"] = stagedRow.baseExtrawkRat;
                            paramRow["baseCapa"] = stagedRow.baseCapa;
                            paramRow["capaUom"] = stagedRow.capaUom;
                            paramRow["resourceType1"] = stagedRow.resourceType1;
                            paramRow["sortSeq"] = stagedRow.sortSeq;
                            paramRow["useYn"] = stagedRow.useYn;

                            paramRow["actionFlg"] = stagedRow.actionFlag;
                            paramRow["plantId"] = vm.mPlantId;
                            paramRow["userId"] = vm.mUserId;
                            params.push(paramRow);
                        }
                    }

                    showDialog(gI18n.tc("SAVE"), gI18n.tc("MSG_SAVE"), DIALOG_TYPE.CONFIRM).then(function (answer) {
                            if (answer) {
                                gridView.showToast(progressSpinner + "Saving data...", true);

                                axios({
                                    method: "post",

                                    // url 재설정 해야되는 곳
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

                                }).catch(function (err) {
                                    console.log(err);

                                }).finally(function () {
                                    gridView.hideToast();
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

            //////////// Grd 생성
            createGrd1: function () {

                var columns_remind = [
                    {name: "plantId", dataType: "text", visible: false, editable: false, width: 0},
                    {name: "resource", dataType: "group", orientation: "horizontal", headerText: "리소스", headerVisible: true,  hideChildHeaders: false,
                        childs: [
                           {name: "resourceCode", dataType: "text", visible: true, editable: false, width: "9",textAlignment: "left", headerText: "코드", textAlignment: "center" },
                           {name: "resourceName", dataType: "text", visible: true, editable: true, width: "9",textAlignment: "left", headerText: "명", textAlignment: "certer" }
                        ]},
                    {name: "capantrgtyn", dataType: "boolean", visible: true, editable: true, width: "100",textAlignment: "center", headerText: "Capa.\n비대상"},
                    {name: "baseManpower", dataType: "number", visible: true, editable: true, width: "100",textAlignment: "right", headerText: "인원", format : "#,###"},
                    {name: "baseWork", dataType: "number", visible: true, editable: true, width: "100",textAlignment: "right", headerText: "가동시간\n(MH)", format : "#,###.0"},
                    {name: "baseOperRat", dataType: "number", visible: true, editable: true, width: "130",textAlignment: "right", headerText: "유효가동율\n(MH)", format : "#,###.0"},
                    {name: "baseEfcyRat", dataType: "number", visible: true, editable: true, width: "100",textAlignment: "right", headerText: "효율\n(%)", format : "#,###.0"},
                    {name: "baseExtrawkRat", dataType: "number", visible: true, editable: true, width: "100",textAlignment: "right", headerText: "잔업율\n(%)", format : "#,###.0"},
                    {name: "baseCapa", dataType: "number", visible: true, editable: false, width: "100",textAlignment: "right", headerText: "Capacity", format : "#,###.###"},
                    {name: "capaUom", dataType: "text", visible: true, editable: true, width: "100",textAlignment: "left", headerText: "단위", useDropdown: true },
                    {name: "resourceType1", dataType: "text", visible: true, editable: true, width: "100",textAlignment: "left", headerText: "타입", useDropdown: true},
                    {name: "sortSeq", dataType: "number", visible: true, editable: true, width: "100",textAlignment: "right", headerText: "조회\n순서", format : "#,###"},
                    {name: "useYn", dataType: "boolean", visible: true, editable: true, width: "100",textAlignment: "center", headerText: "사용\n여부"}
                ];

                /// To set fields and columns 
                var headerGrd1Headers = {
                    fields: [],
                    columns: [],
                    columnProps: [],
                    columns_remind: columns_remind
                }

                // Grid 컬럼 생성 로직
                var tmp_rtn = createGrdHeader(headerGrd1Headers);
                fields = tmp_rtn.fields;
                columns = tmp_rtn.columns;
                columnProps = tmp_rtn.columnProps;

                var site1SumIdx = findWithAttr(fields);
                
                fields[site1SumIdx].calculateCallback = function (dataRow, fieldName, fieldNames, values) {
                    var capantrgtyn = values[fieldNames.indexOf("capantrgtyn")];// Capa.비대상
                    var baseManpower = values[fieldNames.indexOf("baseManpower")];// 인원
                    var baseWork = values[fieldNames.indexOf("baseWork")]; // 가동시간
                    var baseOperRat = values[fieldNames.indexOf("baseOperRat")]; // 유효가동율
                    var baseEfcyRat = values[fieldNames.indexOf("baseEfcyRat")]; // 효율
                    var baseExtrawkRat = values[fieldNames.indexOf("baseExtrawkRat")]; // 잔업율
                    var baseCapa = values[fieldNames.indexOf("baseCapa")]; // Capacity
    
                    if (capantrgtyn === false){
                        gSetEditableColumns(vm.$grd1, dataRow, ["baseManpower","baseWork","baseOperRat","baseEfcyRat","baseExtrawkRat","baseCapa"], true);
                        gridView.setValue(dataRow,"baseCapa",baseCapa = Math.round(baseManpower * (baseWork +(baseWork * (baseExtrawkRat /100))) *(baseOperRat / 100) * (baseEfcyRat / 100) )); 
                    }
                    else if (capantrgtyn === true){
                        gSetEditableColumns(vm.$grd1, dataRow, ["baseManpower","baseWork","baseOperRat","baseEfcyRat","baseExtrawkRat","baseCapa"], false);
                        gridView.setValue(dataRow,"baseCapa", 99.999);
////////////////////////// if Capa. is checked then 5 standards will be set to ""
                        gridView.setValue(dataRow,"baseManpower", "");
                        gridView.setValue(dataRow,"baseWork", "");
                        gridView.setValue(dataRow,"baseOperRat", "");
                        gridView.setValue(dataRow,"baseEfcyRat", "");
                        gridView.setValue(dataRow,"baseExtrawkRat", "");
///////////////////////////////
                    }
                    else
                        gridView.setValue(dataRow,"baseCapa",baseCapa = Math.round(baseManpower * (baseWork +(baseWork * (baseExtrawkRat /100))) *(baseOperRat / 100) * (baseEfcyRat / 100) ));                  
                };

                this.$grd1 = this.$createGrid("grd1", fields, columns);
                var grd1 = this.$grd1;
                var gridView = grd1.gridView;
                var dataProvider = gridView.getDataSource();
                
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

                gridView.setEditorOptions({
                    applyCellFont: true
                });

                gridView.setDisplayOptions({
                    fitStyle: "none"
                });

                gridView.onEditCommit = function (grid, index, oldValue, newValue) {
                    if (index.fieldName === "resourceCode") {
                        vm.oldGrpCode = oldValue;
                    }
                };

                gridView.onCellEdited = function (grid, itemIndex, dataRow, field) {
                    gridView.commit();
                    var dataProvider = grid.getDataSource();
                    var fieldName = dataProvider.getOrgFieldName(field);

                    if (fieldName === "resourceCode") {
                        var processCodeValues = dataProvider.getFieldValues("resourceCode");
                        var editedValue = dataProvider.getValue(dataRow, fieldName);

                        processCodeValues.splice(dataRow, 1);

                        if (processCodeValues.includes(editedValue)) {
                            // MSG_APS_5004 : 중복된 그룹 코드가 존재합니다.
                            showDialog(gI18n.tc("ALERT"), gI18n.tc("MSG_APS_5004"), DIALOG_TYPE.ALERT);
                            dataProvider.setValue(dataRow, fieldName, vm.oldprocessCode);
                        }
                    };
                };

                gridView.onDataCellClicked = function (grid, index) {
                    var plantId = grid.getValue(index.itemIndex, "plantId");
                    // var processCode = grid.getValue(index.itemIndex, "processCode");
                };

                gridView.setEditOptions({
                    insertable: true,
                    appendable: true,
                    deletable: true

                });

                grd1.gStyle = {
                    checkBar: {
                        visible: true
                    },
                    indicator: {
                        visible: true,
                        headText: "No.",
                    }
                }

                gInitStyle(grd1);
                gSetOptions(grd1);

                setGridContextMenu(gridView);

                gridView.setHeader({height: 46});

            },
        },

        mounted: function () {
            this.createGrd1();
            this.exportGrd1.grid = Object.freeze(this.$grd1);
            this.$grd1.gridView.exportSetting = "exportGrd1";

            this.loadPlantInfo();

            // this.$refs.btnSearch.kendoWidget().enable(true);
            // this.$refs.btnSearch.kendoWidget().element[0].innerHTML += "조회";
        },
        updated: function () {
            vm.doResize();
        },
        watch: {
            // mPlantId: function (val) {
            //     if (val) {
            //         vm.loadGrd1();
            //     }
            // }
        }
    });

    // function getStagedRows(dataProvider) {
    //     var allStateRows = dataProvider.getAllStateRows();
    //     var rows = [];
    //     var actionFlag = null;
    //     var stagedRows = [];
    //
    //     var rowStates = Object.getOwnPropertyNames(allStateRows);
    //
    //     for (var i = 0; i < rowStates.length; i++) {
    //         var rowState = rowStates[i];
    //
    //         if (rowState === "created") {
    //             rows = allStateRows.created;
    //             actionFlag = "I";
    //         } else if (rowState === "updated") {
    //             rows = allStateRows.updated;
    //             actionFlag = "U";
    //         } else if (rowState === "deleted") {
    //             rows = allStateRows.deleted;
    //             actionFlag = "D";
    //         }
    //
    //         for (var r = 0; r < rows.length; r++) {
    //             var dataRow = dataProvider.getJsonRow(rows[r]);
    //             dataRow.actionFlag = actionFlag;
    //             stagedRows.push(dataRow);
    //         }
    //     }
    //
    //     return stagedRows;
    // }
</script>

