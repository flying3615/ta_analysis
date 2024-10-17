INSERT INTO crs_work (id, trt_grp, trt_type, status, con_id, pro_id, usr_id_firm, usr_id_principal, cel_id, project_name, invoice, external_work_id, view_txn, restricted, lodged_date, authorised_date, usr_id_authorised, validated_date, usr_id_validated, cos_id, data_loaded, run_auto_rules, alt_id, audit_id, usr_id_prin_firm, manual_rules, trv_id, distorted, ver_datum_code, spi_flag)
VALUES (5000056,'WRKT','LDIV','PREA',NULL,NULL,'firm4','extsurv1',NULL,NULL,NULL,NULL,'N','N',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Y',NULL,50000560,'firm4','N',142,NULL,'WELL',NULL);

INSERT INTO crs_survey (wrk_id, ldt_loc_id, dataset_series, dataset_id, type_of_dataset, data_source, lodge_order, dataset_suffix, surveyor_data_ref, survey_class, description, usr_id_sol, survey_date, certified_date, registered_date, chf_sur_amnd_date, dlr_amnd_date, cadastral_surv_acc, prior_wrk_id, abey_prior_status, fhr_id, pnx_id_submitted, audit_id, usr_id_sol_firm, sig_id, xml_uploaded, xsv_id, alt_survey_no)
VALUES (5000056,1011,'LT','5100021','SRVY','ESUR',1,NULL,'PlangenE2E','5','Plangen E2E test',NULL,NULL,NULL,NULL,NULL,NULL,'Y',NULL,NULL,NULL,NULL,50000560,NULL,NULL,'Y',NULL,NULL);

INSERT INTO cpl_transaction (id, status, last_edited, usr_id_created, crs_sur_wrk_id, alt_id, audit_id, regen_state, usr_id_modified, plangen_offline, cpg_adj_flag, cpl_adj_flag)
VALUES (5000056,NULL,'2024-05-01 09:27:45','extsurv1',5000056,NULL,294122,'CSCS','extsurv1','N',NULL,'Y');

INSERT INTO cpl_survey (ztrn_id, crs_ldt_loc_id, dataset_series, dataset_id, dataset_type, description, survey_date, cert_date, surv_class, surv_data_ref, crs_trt_grp, crs_trt_type, crs_usr_id_princ, crs_usr_id_firm, crs_usr_id_sol, lodged_date, wrk_status, crs_cos_id, data_modified, ta_cert_required, crs_usr_id_prim, auto_notify_date, cadastral_surv_acc, complete_exam, approved_copy, appcopy_delv_meth, notify_new_sup_doc, preval_rep_date, reset_man_rules, wrk_status_prev, created_date, dataset_suffix, prior_wrk_id, usr_id_sol_firm, usr_id_prin_firm, display_exception, usr_id_pc_firm, comment_added, exception_capture_cont, exception_comment, lodged_fee_factors)
VALUES (5000056,1011,'LT','5100020','SRVY','Plangen e2e test','2021-05-17',NULL,'5','PlangenE2E','WRKT','LDIV','extsurv1','firm4',NULL,NULL,'INIT',65,'Y',NULL,'extsurv1','2026-10-18','Y','N','N','ONLM','N',NULL,NULL,'INIT','2024-05-01 09:13:06',NULL,NULL,NULL,'firm4',NULL,'firm4','N         ','N',NULL,NULL);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9915720333 -45.0691670833)', 1),5000056,1,1,22300967,85272,'IS',NULL,'IS IX DP 7441','IS','IX','DP 7441','ADPT',NULL,'TRAV',-45.06916708,170.99157204,428605.74311941117,882951.4834940005,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,-45.068983375174,170.99162570714);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9914138 -45.0690879333)', 1),5000056,2,2,21909003,85275,'PEG',NULL,'PEG XLIV DP 7441','PEG','XLIV','DP 7441','ADPT',NULL,'BOUN',-45.06908794,170.9914138,428593.3208746996,882960.3344895942,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,NULL,NULL,-45.06908820883,170.991413402366);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9909919833 -45.0688538333)', 1),5000056,3,3,21800087,85273,'PEG',NULL,'PEG XL DP 7441','PEG','XL','DP 7441','ADPT',NULL,'BOUN',-45.06885383,170.99099199,428560.2190721654,882986.5008082641,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,NULL,NULL,-45.06885420173,170.990991524885);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9908204333 -45.0690057167)', 1),5000056,4,4,21954043,85276,'PEG',NULL,'PEG XLI DP 7441','PEG','XLI','DP 7441','ADPT',NULL,'BOUN',-45.06900572,170.99082044,428546.633501962,882969.6813238198,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,4,NULL,NULL,-45.069006101838,170.990820014901);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9912843167 -45.0692283167)', 1),5000056,5,5,22050117,85219,'PEG',NULL,'PEG XLV DP 7441','PEG','XLV','DP 7441','ADPT',NULL,'BOUN',-45.06922832,170.99128431,428583.0533092521,882944.7793631302,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,-45.069228625149,170.991283952793);

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9915720333 -45.0691670833, 10.9914138 -45.0690879333)', 1),5000056,1,1,NULL,1,2,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,NULL,'MEAS','MEAS',235.382722222223,235.225780000000,20.378500000000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Y',NULL,NULL,NULL,NULL,1,'L064',NULL,'235°22''578"','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9914138 -45.0690879333, 10.9909919833 -45.0688538333)', 1),5000056,2,2,NULL,2,3,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,'5','ADPT','ADPT',308.308333333333,308.183000000000,42.190000000000,NULL,NULL,0E-12,0E-12,NULL,NULL,52130,52130,'N',NULL,NULL,NULL,NULL,2,'L096',NULL,'308°18''30"','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9909919833 -45.0688538333, 10.9908204333 -45.0690057167)', 1),5000056,3,3,NULL,3,4,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,'5','ADPT','CALC',218.916666666667,218.550000000000,21.620000000000,NULL,NULL,0E-12,NULL,NULL,NULL,52130,NULL,'N',NULL,NULL,NULL,NULL,3,'L096',NULL,'218°55''','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9908204333 -45.0690057167, 10.9912843167 -45.0692283167)', 1),5000056,4,4,NULL,4,5,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,'5','ADPT','ADPT',124.350000000000,124.210000000000,44.120000000000,NULL,NULL,0E-12,0E-12,NULL,NULL,52130,52130,'N',NULL,NULL,NULL,NULL,4,'L096',NULL,'124°21''','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9912843167 -45.0692283167, 10.9915720333 -45.0691670833)', 1),5000056,5,5,NULL,5,1,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,NULL,'MEAS','MEAS',44.898444444444,44.535440000000,38.303600000000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Y',NULL,NULL,NULL,NULL,5,'L064',NULL,'44°53''544"','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9912843167 -45.0692283167, 10.9914138 -45.0690879333)', 1),5000056,6,6,NULL,5,2,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,'5','ADPT','ADPT',33.412500000000,33.244500000000,18.640000000000,NULL,NULL,0E-12,0E-12,NULL,NULL,52130,52130,'N',NULL,NULL,NULL,NULL,6,'L096',NULL,'33°24''45"','F');

INSERT INTO cpl_line (shape, ztrn_id, id, zmrk_id_start, zmrk_id_end, crs_lin_id, line_type, arc_direction, arc_length, arc_major, arc_radius, se_row_id, layer, class, desc_code, description, adopted_source, physical_description, irregular_line_type, start_long, start_lat, end_long, end_lat)
VALUES (ST_GeomFromText('LINESTRING (10.9908204333 -45.0690057167, 10.9912843167 -45.0692283167)', 1),5000056,1,4,5,NULL,'RGHT',NULL,NULL,NULL,NULL,1,'L096',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

INSERT INTO cpl_line (shape, ztrn_id, id, zmrk_id_start, zmrk_id_end, crs_lin_id, line_type, arc_direction, arc_length, arc_major, arc_radius, se_row_id, layer, class, desc_code, description, adopted_source, physical_description, irregular_line_type, start_long, start_lat, end_long, end_lat)
VALUES (ST_GeomFromText('LINESTRING (10.9909919833 -45.0688538333, 10.9908204333 -45.0690057167)', 1),5000056,2,3,4,NULL,'RGHT',NULL,NULL,NULL,NULL,2,'L096',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

INSERT INTO cpl_line (shape, ztrn_id, id, zmrk_id_start, zmrk_id_end, crs_lin_id, line_type, arc_direction, arc_length, arc_major, arc_radius, se_row_id, layer, class, desc_code, description, adopted_source, physical_description, irregular_line_type, start_long, start_lat, end_long, end_lat)
VALUES (ST_GeomFromText('LINESTRING (10.9914138 -45.0690879333, 10.9909919833 -45.0688538333)', 1),5000056,3,2,3,NULL,'RGHT',NULL,NULL,NULL,NULL,3,'L096',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

INSERT INTO cpl_line (shape, ztrn_id, id, zmrk_id_start, zmrk_id_end, crs_lin_id, line_type, arc_direction, arc_length, arc_major, arc_radius, se_row_id, layer, class, desc_code, description, adopted_source, physical_description, irregular_line_type, start_long, start_lat, end_long, end_lat)
VALUES (ST_GeomFromText('LINESTRING (10.9914138 -45.0690879333, 10.9912843167 -45.0692283167)', 1),5000056,4,2,5,NULL,'RGHT',NULL,NULL,NULL,NULL,4,'L096',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

INSERT INTO cpl_parcel (shape, ztrn_id, id, crs_par_id, linked, afp_action, parcel_intent, topo_class, area, calc_area, par_appel_date, par_entitlement, app_part_indic, height_limited, app_title, app_survey, app_type, app_format, agn_sub_type, agn_sub_type_pos, agn_appel_value, agn_parcel_type, agn_parcel_value, agn_sec_parc_type, agn_sec_parc_value, agn_block_number, ama_parcel_value, ama_maori_name, aot_appellation, crs_app_id, new_app_id, new_par_id, existing, se_row_id, app_simple)
VALUES (ST_GeomFromText('MULTIPOLYGON (((10.9908204333 -45.0690057167, 10.9912843167 -45.0692283167, 10.9914138 -45.0690879333, 10.9909919833 -45.0688538333, 10.9908204333 -45.0690057167)))', 1),5000056,1,NULL,'Y','CREA','FSIM','PRIM',867.0000,867.1789,NULL,NULL,'WHOL',NULL,'Y','Y','GNRL','STDS','DP','PRFX','2100020','LOT','1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'Y');

INSERT INTO cpl_parcel_label (shape, ztrn_id, zpar_id, se_row_id, id)
VALUES (ST_GeomFromText('POINT (10.9911215833 -45.0690416833)', 1),5000056,1,1,1);

INSERT INTO cpl_line_obs (ztrn_id, zobs_id, zlin_id)
VALUES (5000056,2,3);

INSERT INTO cpl_line_obs (ztrn_id, zobs_id, zlin_id)
VALUES (5000056,3,2);

INSERT INTO cpl_line_obs (ztrn_id, zobs_id, zlin_id)
VALUES (5000056,4,1);

INSERT INTO cpl_line_obs (ztrn_id, zobs_id, zlin_id)
VALUES (5000056,6,4);

INSERT INTO cpl_parcel_ring (ztrn_id, id, pri_id_parent_ring, zpar_id, is_ring, se_row_id, matched, pgn_id_tmp, topo_class)
VALUES (5000056,1,NULL,1,'Y',NULL,'N',NULL,'PRIM');

INSERT INTO cpl_parcel_bndry (ztrn_id, sequence, zpri_id, reversed, zlin_id)
VALUES (5000056,4,1,'Y',1);

INSERT INTO cpl_parcel_bndry (ztrn_id, sequence, zpri_id, reversed, zlin_id)
VALUES (5000056,3,1,'N',4);

INSERT INTO cpl_parcel_bndry (ztrn_id, sequence, zpri_id, reversed, zlin_id)
VALUES (5000056,2,1,'Y',3);

INSERT INTO cpl_parcel_bndry (ztrn_id, sequence, zpri_id, reversed, zlin_id)
VALUES (5000056,1,1,'Y',2);

INSERT INTO cpl_parcel_dimen (ztrn_id, id, zpar_id, zobs_id)
VALUES (5000056,1,1,2);

INSERT INTO cpl_parcel_dimen (ztrn_id, id, zpar_id, zobs_id)
VALUES (5000056,2,1,3);

INSERT INTO cpl_parcel_dimen (ztrn_id, id, zpar_id, zobs_id)
VALUES (5000056,3,1,4);

INSERT INTO cpl_parcel_dimen (ztrn_id, id, zpar_id, zobs_id)
VALUES (5000056,4,1,6);

INSERT INTO cpl_sur_admin_area (ztrn_id, crs_stt_id)
VALUES (5000056,1027);

INSERT INTO crs_lw_rel_editor (id, usr_id_related, related_person_typ, related_category, ttin_id, zsur_ztrn_id, usr_id_rel_firm, related_role, related_multi_role_id)
VALUES (52100030,'extsurv1','SURV','SURV',NULL,5000056,'firm4',NULL,1);

INSERT INTO crs_lw_rel_editor (id, usr_id_related, related_person_typ, related_category, ttin_id, zsur_ztrn_id, usr_id_rel_firm, related_role, related_multi_role_id)
VALUES (52100031,'extsurv1','ENBL','SURV',NULL,5000056,'firm4',NULL,1);

INSERT INTO crs_lw_rel_editor (id, usr_id_related, related_person_typ, related_category, ttin_id, zsur_ztrn_id, usr_id_rel_firm, related_role, related_multi_role_id)
VALUES (52100032,'extsurv1','PCNT','SURV',NULL,5000056,'firm4',NULL,1);

INSERT INTO cpg_xml_file (ztrn_id, refresh_xml_file, xml_file, xml_changed, xml_datetime, usr_id_modified, date_modified)
VALUES (5000056, 'N', '<?xml version="1.0" encoding="UTF-8"?><CPG_XML01 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" transactionId="123"><Diagram id="1" originPageOffset="0 0" bottomRightPoint="79.252 -86.114" diagramType="sysGenPrimaryDiag" /><Page id="1" pageType="title" pageNumber="1"/></CPG_XML01>', 'N', '2024-05-09 09:33:47', 'extsurv1', '2024-04-12 13:48:11');

-- manually added.
-- RT Boundary and Abuttal lines added by the surveyor
INSERT INTO crs_dig_plan_line(ztrn_id, id, lin_id, shape, se_row_id, symbology)
VALUES (5000056, 5000056, null, ST_GeomFromText('LINESTRING (10.9908477667 -45.0692894167, 10.9912594833 -45.0690421333)', 1), 5000056, 1 );

INSERT INTO crs_dig_plan_line(ztrn_id, id, lin_id, shape, se_row_id, symbology)
VALUES (5000056, 5100056, null, ST_GeomFromText('LINESTRING (10.9909477667 -45.0693894167, 10.9913594833 -45.0691421333)', 1), 5000056, 2 );

-- lock transaction
execute procedure cp_ccl_setSessionContext('extsurv1', '', 0);
execute procedure cp_cdb_lock_rows_nosession(
  cf_cdb_lock_start_nosession('SURV', 'test lock 5000056'),
  'cpl_transaction',
  'id=5000056'
);
execute procedure cp_ccl_setSessionContext('', '', 0);
