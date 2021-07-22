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
                },
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

                            var plantNameElement = document.getElementById('plant_name');

                            // plantName input_style 속성 정의
                            if (plantNameElement) {                     
                                plantNameElement.disabled = true;
                                plantNameElement.style.background = "#F0F0F0";
                            }

                            break;
                        }
                    }
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
            insertRowGrd1: function() {
                var gridView = this.$grd1.gridView;
                var dataProvider = this.$grd1.dataProvider;

                if (this.$grd1.dataProvider.getRowCount() > 0) {
                this.$grd1.dataProvider.insertRow(
                    this.$grd1.gridView.getCurrent().dataRow + 1,[]
                ); //insert below row
                this.$grd1.gridView.commit(true);
                } else {
                    this.$grd1.gridView.beginAppendRow(0);
                    this.$grd1.gridView.commit(true);
                }
                //////////////// To edit the function of adding rows 
                gridView.setValue(this.$grd1.gridView.getCurrent().dataRow + 1, "useYn", "Y");
                gridView.setValue(this.$grd1.gridView.getCurrent().dataRow + 1, "capantrgtyn", "Y");

                if (dataProvider.getValue(this.$grd1.gridView.getCurrent().dataRow + 1,"capantrgtyn") === "Y"){
                    gSetEditableColumns(vm.$grd1, this.$grd1.gridView.getCurrent().dataRow + 1, ["baseManpower","baseWork","baseOperRat","baseEfcyRat","baseExtrawkRat"], false);
                }
                else 
                    gSetEditableColumns(vm.$grd1, this.$grd1.gridView.getCurrent().dataRow + 1, ["baseManpower","baseWork","baseOperRat","baseEfcyRat","baseExtrawkRat"], true);
                
                gSetEditableColumns(vm.$grd1, this.$grd1.gridView.getCurrent().dataRow + 1, ["resourceCode",], true);
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
                                url: BASE_URL + "hhmp9040m/demand/s1",
                                headers: { "content-type": "application/json" },
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
                    url: BASE_URL + "hhmp9040m/demand/q1",  

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
                                    url: BASE_URL + "hhmp9040m/demand/s1",

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
                var fields = [
                    { fieldName: "plantId",dataType: "text",visible: false, editable: false,width: "130"},
                    { fieldName: "resourceCode",dataType: "text",visible: true, editable: false,width: "130"},
                    { fieldName: "resourceName", dataType:"text",visible: true, editable: true,width: "130"},
                    { fieldName: "capantrgtyn" ,dataType: "boolen",visible: true, editable: true,width: "130"},
                    { fieldName: "baseManpower",dataType: "number",visible: true, editable: true,width: "130"},
                    { fieldName: "baseWork" ,dataType: "number",visible: true, editable: true,width: "130"},
                    { fieldName: "baseOperRat",dataType: "number",visible: true, editable: true,width: "130" },
                    { fieldName: "baseEfcyRat",dataType: "number",visible: true, editable: true,width: "130" },
                    { fieldName: "baseExtrawkRat",dataType: "number",visible: true, editable: true,width: "130" },
                    { fieldName: "baseCapa",dataType: "number",visible: true, editable: false,width: "130"
                    ///////////////////////////// To calculate the Capacity 
                        ,calculateCallback : function (dataRow, fieldName, fieldNames, values) {
                            var capantrgtyn = values[fieldNames.indexOf("capantrgtyn")]; // Capa.비대상
                            var baseManpower = values[fieldNames.indexOf("baseManpower")];// 인원
                            var baseWork = values[fieldNames.indexOf("baseWork")]; // 가동시간
                            var baseOperRat = values[fieldNames.indexOf("baseOperRat")]; // 유효가동율
                            var baseEfcyRat = values[fieldNames.indexOf("baseEfcyRat")]; // 효율
                            var baseExtrawkRat = values[fieldNames.indexOf("baseExtrawkRat")]; // 잔업율
                            var baseCapa = values[fieldNames.indexOf("baseCapa")]; // Capacity
                            
                            if (capantrgtyn === "N"){
                                gSetEditableColumns(vm.$grd1, dataRow, ["baseManpower","baseWork","baseOperRat","baseEfcyRat","baseExtrawkRat"], true);
                                return baseCapa = Math.round(baseManpower * (baseWork +(baseWork * (baseExtrawkRat /100))) *(baseOperRat / 100) * (baseEfcyRat / 100) );
                            }                           
                            else if (capantrgtyn === "Y"){
                                gSetEditableColumns(vm.$grd1, dataRow, ["baseManpower","baseWork","baseOperRat","baseEfcyRat","baseExtrawkRat"], false);
                                return baseCapa;
                            }                            
                            else
                                return baseCapa = Math.round(baseManpower * (baseWork +(baseWork * (baseExtrawkRat /100))) *(baseOperRat / 100) * (baseEfcyRat / 100) );  
                        }      
                    },
                    { fieldName: "capaUom",dataType: "text",visible: true, editable: true,width: "130"},
                    { fieldName: "resourceType1",dataType: "text",visible: true, editable: true,width: "130"},
                    { fieldName: "sortSeq",dataType: "number",visible: true, editable: true,width: "130" },
                    { fieldName: "useYn",dataType: "boolen",width: "130"}      
                ];

                var columns = [
                    {name:"plantId",fieldName: "plantId",styles: { textAlignment: "near" },editable: false,visible: false},{type: "group",name: "process",header: {"text": transLangKey("리소스")},orientation: "Horizontal",columns: [
                            {name: "resourceCode",fieldName: "resourceCode",width: "130",textAlignment: "center",editable: false,header: {"text": transLangKey("코드")}},
                            {name: "resourceName",fieldName: "resourceName",width: "130",textAlignment: "center",header: {"text": transLangKey("명")}},]},
                    {name:"capantrgtyn",fieldName: "capantrgtyn",header: { text: transLangKey("Capa.\n비대상") },styles: { textAlignment: "center" },renderer: {type: "check",shape: "box",editable: true,startEditOnClick: true,trueValues: "Y",falseValues: "N"}},
                    {name: "baseManpower",fieldName: "baseManpower",styles: {type: "number",editFormat: "#,##0",textAlignment: "far"},editor: {type: "number",editFormat: "#,##0"},header: {"text": transLangKey("인원")}},
                    {name: "baseWork",fieldName: "baseWork",styles: {"textAlignment": "center",numberFormat: "#,##0.0"},editable: true,editor: {type: "number",editFormat: "#,##0.0"},header: {"text": transLangKey("가동시간\n(MH)")}},
                    {name: "baseOperRat",fieldName: "baseOperRat",styles: {"textAlignment": "center",numberFormat: "#,##0.0"},editor: {type: "number",editFormat: "#,##0.0"},header: {"text": transLangKey("유효가동율\n(%)")}},
                    {name: "baseEfcyRat",fieldName: "baseEfcyRat",styles: {"textAlignment": "center",numberFormat: "#,##0.0"},editor: {type: "number",editFormat: "#,##0.0"},header: {"text": transLangKey("효율\n(%)")}},
                    {name: "baseExtrawkRat",fieldName: "baseExtrawkRat",styles: {"textAlignment": "center",numberFormat: "#,##0.0"},editor: {type: "number",editFormat: "#,##0.0"},header: {"text": transLangKey("잔업율\n(%)")}},
                    {name: "baseCapa",fieldName: "baseCapa",styles: {"textAlignment": "center",numberFormat: "#,##0"},editor: {type: "number",editFormat: "#,##0"},editable: false,visitable: true,header: {"text": transLangKey("Capacity")},editor: {type: "number",editFormat:"#,##0"}},
                    {name: "capaUom",fieldName: "capaUom",width: "130",lookupDisplay: true,values: ["EA","MH","MM"],labels: ["EA","MH","MM"],editor: {type: "dropDown",dropDownCount: 3,domainOnly: true,},styles: {"textAlignment": "center"},header: {"text": transLangKey("단위")}},
                    {name: "resourceType1",fieldName: "resourceType1",styles: {"textAlignment": "center"},lookupDisplay: true,editable: true,sortable: false,values: [1,2,3],labels: ["자작","도급","외주"],editor: {type: "dropDown",dropDownCount: 3,domainOnly: true,},header: {"text": transLangKey("타입")}},
                    {name: "sortSeq",fieldName: "sortSeq",width: "130",styles: {"textAlignment": "center",numberFormat: "#,##0"},editor: {type: "number",editFormat: "#,##0"},header: {"text": transLangKey("조회\n순서")}},
                    {name: "useYn",fieldName: "useYn",header: { text: transLangKey("사용\n여부") },styles: { textAlignment: "center" },visible: true,renderer: {type: "check",shape: "box",editable: true,startEditOnClick: true,trueValues: "Y",falseValues: "N"}}
                ];

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
                        visible : true,
                        headText : "No.",
                    }
                }

                gInitStyle(grd1);
                gSetOptions(grd1);

                setGridContextMenu(gridView);

                gridView.setHeader({ height: 46 });
              
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
        updated: function(){
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

    function getStagedRows(dataProvider) {
        var allStateRows = dataProvider.getAllStateRows();
        var rows = [];
        var actionFlag = null;
        var stagedRows = [];

        var rowStates = Object.getOwnPropertyNames(allStateRows);

        for (var i = 0; i < rowStates.length; i++) {
            var rowState = rowStates[i];

            if (rowState === "created") {
                rows = allStateRows.created;
                actionFlag = "I";
            } else if (rowState === "updated") {
                rows = allStateRows.updated;
                actionFlag = "U";
            } else if (rowState === "deleted") {
                rows = allStateRows.deleted;
                actionFlag = "D";
            }

            for (var r = 0; r < rows.length; r++) {
                var dataRow = dataProvider.getJsonRow(rows[r]);
                dataRow.actionFlag = actionFlag;
                stagedRows.push(dataRow);
            }
        }

        return stagedRows;
    }
</script>

