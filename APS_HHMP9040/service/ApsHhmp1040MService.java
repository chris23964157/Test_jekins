package com.zionex.t3series.web.hshi.aps.hhmp.hhmp1000.service;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.ParameterMode;

import com.zionex.t3series.util.ObjectUtil;
import com.zionex.t3series.web.hshi.aps.hhmp.hhmp1000.entity.ApsHhmp1040M01;
import com.zionex.t3series.web.util.query.QueryHandler;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.AllArgsConstructor;
import lombok.extern.java.Log;

@Service
@AllArgsConstructor
@Log
public class ApsHhmp1040MService {

    private final QueryHandler queryHandler;

    @SuppressWarnings("unchecked")
    public List<ApsHhmp1040M01> getGrd1Data(String plantId) {

        Map<String, Object> params = new HashMap<>();

        params.put("P_PLANT_ID", new Object[] { plantId, String.class, ParameterMode.IN });

        return (List<ApsHhmp1040M01>) queryHandler.getProcedureData("SP_UI_APS_HHMP1040M_RESOURCE_01_Q",
                ApsHhmp1040M01.class, params);
    }

    @Transactional
    public Map<String, Object> saveGrd1Data(List<ApsHhmp1040M01> data) {
        Map<String, Object> resultMap = new HashMap<>();

        for (ApsHhmp1040M01 row : data) {
            Map<String, Object> params = new HashMap<>();
            params.put("P_ACTION_FLG", new Object[] { row.getActionFlg(), String.class, ParameterMode.IN });
            params.put("P_PLANT_ID", new Object[] { row.getPlantId(), String.class, ParameterMode.IN });

            // CHANGED ITEMS FROM THOSE ROWS
            // TO BE CAREFUL FOR THE ROW.BALA
            params.put("P_RESOURCE_CODE", new Object[] { row.getResourceCode(), String.class, ParameterMode.IN });
            params.put("P_RESOURCE_NAME", new Object[] { row.getResourceName(), String.class, ParameterMode.IN });
            params.put("P_RESOURCE_TYPE1", new Object[] { row.getResourceType1(), String.class, ParameterMode.IN });
            params.put("P_BASE_CAPA", new Object[] { row.getBaseCapa(), String.class, ParameterMode.IN });
            params.put("P_CAPA_UOM", new Object[] { row.getCapaUom(), String.class, ParameterMode.IN });
            params.put("P_SORT_SEQ", new Object[] { row.getSortSeq(), String.class, ParameterMode.IN });
            params.put("P_USE_YN", new Object[] { row.getUseYn(), String.class, ParameterMode.IN });
            params.put("P_CAPA_NTRGT_YN", new Object[] { row.getCapantrgtyn(), String.class, ParameterMode.IN });
            params.put("P_BASE_MANPOWER", new Object[] { row.getBaseManpower(), String.class, ParameterMode.IN });
            params.put("P_BASE_WORK_MH", new Object[] { row.getBaseWork(), String.class, ParameterMode.IN });
            params.put("P_BASE_OPER_RAT", new Object[] { row.getBaseOperRat(), String.class, ParameterMode.IN });
            params.put("P_BASE_EFCY_RAT", new Object[] { row.getBaseEfcyRat(), String.class, ParameterMode.IN });
            params.put("P_BASE_EXTRAWK_RAT", new Object[] { row.getBaseExtrawkRat(), String.class, ParameterMode.IN });
            params.put("P_USER_ID", new Object[] { row.getUserId(), String.class, ParameterMode.IN });

            params.put("P_RT_ROLLBACK_FLAG", new Object[] { null, String.class, ParameterMode.OUT });
            params.put("P_RT_MSG", new Object[] { null, String.class, ParameterMode.OUT });

            Map<String, Object> rt = queryHandler.checkResultFlag((List<Map<String, Object>>) queryHandler
                    .getProcedureData("SP_UI_APS_HHMP1040M_RESOURCE_01_S", null, params));

            if (!ObjectUtil.toBoolean(rt.get("success"))) {
                log.warning("success : " + ObjectUtil.toString(rt.get("success")) + "/ message : "
                        + ObjectUtil.toString(rt.get("message")));
                throw new RuntimeException(rt.get("message").toString());
            } else {
                resultMap.putAll(rt);
            }
        }

        return resultMap;
    }

}
