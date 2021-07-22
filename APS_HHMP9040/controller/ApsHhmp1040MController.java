package com.zionex.t3series.web.hshi.aps.hhmp.hhmp1000.controller;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.zionex.t3series.web.hshi.aps.hhmp.hhmp1000.entity.ApsHhmp1040M01;
import com.zionex.t3series.web.hshi.aps.hhmp.hhmp1000.service.ApsHhmp1040MService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
public class ApsHhmp1040MController {

    private final ApsHhmp1040MService apsHhmp1040MService;

    @PostMapping("/hhmp1040m/demand/q1")
    public List<ApsHhmp1040M01> getGrd01Data(@RequestParam("PLANT_ID") String plantId) {

        return apsHhmp1040MService.getGrd1Data(plantId);
    }

    @PostMapping("/hhmp1040m/demand/s1")
    public Map<String, Object> saveGrd1Data(@RequestBody List<ApsHhmp1040M01> data) {
        Map<String, Object> result = new HashMap<String, Object>();

        try {
            result = apsHhmp1040MService.saveGrd1Data(data);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
        }

        return result;
    }
}