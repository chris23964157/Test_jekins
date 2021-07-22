package com.zionex.t3series.web.hshi.aps.hhmp.hhmp1000.entity;

import java.io.Serializable;
import java.sql.Timestamp;

import javax.persistence.Column;
import javax.persistence.Transient;
import javax.persistence.Entity;
import javax.persistence.Id;

import lombok.Data;

@Data
@Entity
public class ApsHhmp1040M01 implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Column(name = "RESOURCE_CODE")
    String resourceCode;

    @Column(name = "RESOURCE_NAME")
    String resourceName;

    @Column(name = "CAPA_NTRGT_YN")
    String capantrgtyn;

    @Column(name = "BASE_MANPOWER")
    String baseManpower;

    @Column(name = "BASE_WORK_MH")
    String baseWork;

    @Column(name = "BASE_OPER_RAT")
    String baseOperRat;

    @Column(name = "BASE_EFCY_RAT")
    String baseEfcyRat;

    @Column(name = "BASE_EXTRAWK_RAT")
    String baseExtrawkRat;

    @Column(name = "BASE_CAPA")
    String baseCapa;

    @Column(name = "CAPA_UOM")
    String capaUom;

    @Column(name = "RESOURCE_TYPE1")
    String resourceType1;

    @Column(name = "SORT_SEQ")
    String sortSeq;

    @Column(name = "USE_YN")
    String useYn;

    @Id
    @Column(name = "PLANT_ID")
    String plantId;

    @Transient
    String actionFlg;

    @Transient
    String userId;

}
