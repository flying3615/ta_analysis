INSERT INTO crs_work (id, trt_grp, trt_type, status, con_id, pro_id, usr_id_firm, usr_id_principal, cel_id, project_name, invoice, external_work_id, view_txn, restricted, lodged_date, authorised_date, usr_id_authorised, validated_date, usr_id_validated, cos_id, data_loaded, run_auto_rules, alt_id, audit_id, usr_id_prin_firm, manual_rules, trv_id, distorted, ver_datum_code, spi_flag)
VALUES (5000059,'WRKT','LDIV','PREA',NULL,NULL,'firm4','extsurv1',NULL,NULL,NULL,NULL,'N','N',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Y',NULL,50000590,'firm4','N',142,NULL,'WELL',NULL);

INSERT INTO crs_survey (wrk_id, ldt_loc_id, dataset_series, dataset_id, type_of_dataset, data_source, lodge_order, dataset_suffix, surveyor_data_ref, survey_class, description, usr_id_sol, survey_date, certified_date, registered_date, chf_sur_amnd_date, dlr_amnd_date, cadastral_surv_acc, prior_wrk_id, abey_prior_status, fhr_id, pnx_id_submitted, audit_id, usr_id_sol_firm, sig_id, xml_uploaded, xsv_id, alt_survey_no)
VALUES (5000059,1011,'LT','5100033','SRVY','ESUR',1,NULL,'PlangenE2E59','5','Plangen E2E test',NULL,NULL,NULL,NULL,NULL,NULL,'Y',NULL,NULL,NULL,NULL,50000590,NULL,NULL,'Y',NULL,NULL);

INSERT INTO cpl_transaction (id, status, last_edited, usr_id_created, crs_sur_wrk_id, alt_id, audit_id, regen_state, usr_id_modified, plangen_offline, cpg_adj_flag, cpl_adj_flag)
VALUES (5000059,NULL,'2024-05-01 09:27:45','extsurv1',5000059,NULL,294122,'CSCS','extsurv1','N',NULL,'Y');

INSERT INTO cpl_survey (ztrn_id, crs_ldt_loc_id, dataset_series, dataset_id, dataset_type, description, survey_date, cert_date, surv_class, surv_data_ref, crs_trt_grp, crs_trt_type, crs_usr_id_princ, crs_usr_id_firm, crs_usr_id_sol, lodged_date, wrk_status, crs_cos_id, data_modified, ta_cert_required, crs_usr_id_prim, auto_notify_date, cadastral_surv_acc, complete_exam, approved_copy, appcopy_delv_meth, notify_new_sup_doc, preval_rep_date, reset_man_rules, wrk_status_prev, created_date, dataset_suffix, prior_wrk_id, usr_id_sol_firm, usr_id_prin_firm, display_exception, usr_id_pc_firm, comment_added, exception_capture_cont, exception_comment, lodged_fee_factors)
VALUES (5000059,1011,'LT','5100020','SRVY','Plangen e2e test','2021-05-17',NULL,'5','PlangenE2E','WRKT','LDIV','extsurv1','firm4',NULL,NULL,'INIT',65,'Y',NULL,'extsurv1','2026-10-18','Y','N','N','ONLM','N',NULL,NULL,'INIT','2024-05-01 09:13:06',NULL,NULL,NULL,'firm4',NULL,'firm4','N ','N',NULL,NULL);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9915720333 -45.0691670833)', 1),5000059,1,1,22300967,85272,'IS',NULL,'IS IX DP 7441','IS','IX','DP 7441','ADPT',NULL,'TRAV',-45.06916708,170.99157204,428605.74311941117,882951.4834940005,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,-45.068983375174,170.99162570714);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9914138 -45.0690879333)', 1),5000059,2,2,21909003,85275,'PEG',NULL,'PEG XLIV DP 7441','PEG','XLIV','DP 7441','ADPT',NULL,'BOUN',-45.06908794,170.9914138,428593.3208746996,882960.3344895942,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,2,NULL,NULL,-45.06908820883,170.991413402366);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9909919833 -45.0688538333)', 1),5000059,3,3,21800087,85273,'PEG',NULL,'PEG XL DP 7441','PEG','XL','DP 7441','ADPT',NULL,'BOUN',-45.06885383,170.99099199,428560.2190721654,882986.5008082641,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,NULL,NULL,-45.06885420173,170.990991524885);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9908204333 -45.0690057167)', 1),5000059,4,4,21954043,85276,'PEG',NULL,'PEG XLI DP 7441','PEG','XLI','DP 7441','ADPT',NULL,'BOUN',-45.06900572,170.99082044,428546.633501962,882969.6813238198,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,4,NULL,NULL,-45.069006101838,170.990820014901);

INSERT INTO cpl_mark (shape, ztrn_id, id, ref_id, nod_id, mrk_id, mrk_type, desc, name, name_type, number, plan_ref, state, nod_type, now_purpose, lat, long, easting, northing, acc_multiplier, disturbed, disturbed_date, mrk_id_disturbed, replaced, replaced_date, mrk_id_replaced, replaced_name, replaced_ann, mps_condition, mrk_existing, mrk_new_id, nod_existing, nod_new_id, coo_existing, coo_new_id, system_added, se_row_id, northing_orig, easting_orig, adj_lat, adj_long)
VALUES (ST_GeomFromText('POINT (10.9912843167 -45.0692283167)', 1),5000059,5,5,22050117,85219,'PEG',NULL,'PEG XLV DP 7441','PEG','XLV','DP 7441','ADPT',NULL,'BOUN',-45.06922832,170.99128431,428583.0533092521,882944.7793631302,NULL,'N',NULL,NULL,'N',NULL,NULL,NULL,NULL,'RELB',NULL,NULL,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,-45.069228625149,170.991283952793);

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9915720333 -45.0691670833, 10.9914138 -45.0690879333)', 1),5000059,1,1,NULL,1,2,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,NULL,'MEAS','MEAS',235.382722222223,235.225780000000,20.378500000000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Y',NULL,NULL,NULL,NULL,1,'L064',NULL,'235°22''578"','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9914138 -45.0690879333, 10.9909919833 -45.0688538333)', 1),5000059,2,2,NULL,2,3,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,'5','ADPT','ADPT',308.308333333333,308.183000000000,42.190000000000,NULL,NULL,0E-12,0E-12,NULL,NULL,52130,52130,'N',NULL,NULL,NULL,NULL,2,'L096',NULL,'308°18''30"','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9909919833 -45.0688538333, 10.9908204333 -45.0690057167)', 1),5000059,3,3,NULL,3,4,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,'5','ADPT','CALC',218.916666666667,218.550000000000,21.620000000000,NULL,NULL,0E-12,NULL,NULL,NULL,52130,NULL,'N',NULL,NULL,NULL,NULL,3,'L096',NULL,'218°55''','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9908204333 -45.0690057167, 10.9912843167 -45.0692283167)', 1),5000059,4,4,NULL,4,5,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,'5','ADPT','ADPT',124.350000000000,124.210000000000,44.120000000000,NULL,NULL,0E-12,0E-12,NULL,NULL,52130,52130,'N',NULL,NULL,NULL,NULL,4,'L096',NULL,'124°21''','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9912843167 -45.0692283167, 10.9915720333 -45.0691670833)', 1),5000059,5,5,NULL,5,1,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,NULL,'MEAS','MEAS',44.898444444444,44.535440000000,38.303600000000,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Y',NULL,NULL,NULL,NULL,5,'L064',NULL,'44°53''544"','F');

INSERT INTO cpl_observation (shape, ztrn_id, id, seq_id, code, zmrk_id_local, zmrk_id_remt, reversed, new_obn_id_bear, new_obn_id_dist, stp_equip_type, sub_type, acc_multiplier, cadast_class, surv_class_bear, surv_class_dist, bearing, bearing_display, distance, arc_radius, arc_direction, adp_bear_factor, adp_dist_factor, oba_bear_acc, oba_dist_acc, adp_wrk_id_bea, adp_wrk_id_dst, traverse, new_oba_id_bea, new_oba_id_dst, new_stp_id_lcl, new_stp_id_rmt, se_row_id, layer, system_added, bearing_formatted, exclude_from_plangen)
VALUES (ST_GeomFromText('LINESTRING (10.9912843167 -45.0692283167, 10.9914138 -45.0690879333)', 1),5000059,6,6,NULL,5,2,'N',NULL,NULL,'UNKN','RGTL',1.000000000000,'5','ADPT','ADPT',33.412500000000,33.244500000000,18.640000000000,NULL,NULL,0E-12,0E-12,NULL,NULL,52130,52130,'N',NULL,NULL,NULL,NULL,6,'L096',NULL,'33°24''45"','F');

INSERT INTO cpl_line (shape, ztrn_id, id, zmrk_id_start, zmrk_id_end, crs_lin_id, line_type, arc_direction, arc_length, arc_major, arc_radius, se_row_id, layer, class, desc_code, description, adopted_source, physical_description, irregular_line_type, start_long, start_lat, end_long, end_lat)
VALUES (ST_GeomFromText('LINESTRING (10.9908204333 -45.0690057167, 10.9912843167 -45.0692283167)', 1),5000059,1,4,5,NULL,'RGHT',NULL,NULL,NULL,NULL,1,'L096',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

INSERT INTO cpl_line (shape, ztrn_id, id, zmrk_id_start, zmrk_id_end, crs_lin_id, line_type, arc_direction, arc_length, arc_major, arc_radius, se_row_id, layer, class, desc_code, description, adopted_source, physical_description, irregular_line_type, start_long, start_lat, end_long, end_lat)
VALUES (ST_GeomFromText('LINESTRING (10.9909919833 -45.0688538333, 10.9908204333 -45.0690057167)', 1),5000059,2,3,4,NULL,'RGHT',NULL,NULL,NULL,NULL,2,'L096',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

INSERT INTO cpl_line (shape, ztrn_id, id, zmrk_id_start, zmrk_id_end, crs_lin_id, line_type, arc_direction, arc_length, arc_major, arc_radius, se_row_id, layer, class, desc_code, description, adopted_source, physical_description, irregular_line_type, start_long, start_lat, end_long, end_lat)
VALUES (ST_GeomFromText('LINESTRING (10.9914138 -45.0690879333, 10.9909919833 -45.0688538333)', 1),5000059,3,2,3,NULL,'RGHT',NULL,NULL,NULL,NULL,3,'L096',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

INSERT INTO cpl_line (shape, ztrn_id, id, zmrk_id_start, zmrk_id_end, crs_lin_id, line_type, arc_direction, arc_length, arc_major, arc_radius, se_row_id, layer, class, desc_code, description, adopted_source, physical_description, irregular_line_type, start_long, start_lat, end_long, end_lat)
VALUES (ST_GeomFromText('LINESTRING (10.9914138 -45.0690879333, 10.9912843167 -45.0692283167)', 1),5000059,4,2,5,NULL,'RGHT',NULL,NULL,NULL,NULL,4,'L096',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);

INSERT INTO cpl_parcel (shape, ztrn_id, id, crs_par_id, linked, afp_action, parcel_intent, topo_class, area, calc_area, par_appel_date, par_entitlement, app_part_indic, height_limited, app_title, app_survey, app_type, app_format, agn_sub_type, agn_sub_type_pos, agn_appel_value, agn_parcel_type, agn_parcel_value, agn_sec_parc_type, agn_sec_parc_value, agn_block_number, ama_parcel_value, ama_maori_name, aot_appellation, crs_app_id, new_app_id, new_par_id, existing, se_row_id, app_simple)
VALUES (ST_GeomFromText('MULTIPOLYGON (((10.9908204333 -45.0690057167, 10.9912843167 -45.0692283167, 10.9914138 -45.0690879333, 10.9909919833 -45.0688538333, 10.9908204333 -45.0690057167)))', 1),5000059,1,NULL,'Y','CREA','FSIM','PRIM',867.0000,867.1789,NULL,NULL,'WHOL',NULL,'Y','Y','GNRL','STDS','DP','PRFX','2100020','LOT','1',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'Y');

INSERT INTO cpl_parcel_label (shape, ztrn_id, zpar_id, se_row_id, id)
VALUES (ST_GeomFromText('POINT (10.9911215833 -45.0690416833)', 1),5000059,1,1,1);

INSERT INTO cpl_line_obs (ztrn_id, zobs_id, zlin_id)
VALUES (5000059,2,3);

INSERT INTO cpl_line_obs (ztrn_id, zobs_id, zlin_id)
VALUES (5000059,3,2);

INSERT INTO cpl_line_obs (ztrn_id, zobs_id, zlin_id)
VALUES (5000059,4,1);

INSERT INTO cpl_line_obs (ztrn_id, zobs_id, zlin_id)
VALUES (5000059,6,4);

INSERT INTO cpl_parcel_ring (ztrn_id, id, pri_id_parent_ring, zpar_id, is_ring, se_row_id, matched, pgn_id_tmp, topo_class)
VALUES (5000059,1,NULL,1,'Y',NULL,'N',NULL,'PRIM');

INSERT INTO cpl_parcel_bndry (ztrn_id, sequence, zpri_id, reversed, zlin_id)
VALUES (5000059,4,1,'Y',1);

INSERT INTO cpl_parcel_bndry (ztrn_id, sequence, zpri_id, reversed, zlin_id)
VALUES (5000059,3,1,'N',4);

INSERT INTO cpl_parcel_bndry (ztrn_id, sequence, zpri_id, reversed, zlin_id)
VALUES (5000059,2,1,'Y',3);

INSERT INTO cpl_parcel_bndry (ztrn_id, sequence, zpri_id, reversed, zlin_id)
VALUES (5000059,1,1,'Y',2);

INSERT INTO cpl_parcel_dimen (ztrn_id, id, zpar_id, zobs_id)
VALUES (5000059,1,1,2);

INSERT INTO cpl_parcel_dimen (ztrn_id, id, zpar_id, zobs_id)
VALUES (5000059,2,1,3);

INSERT INTO cpl_parcel_dimen (ztrn_id, id, zpar_id, zobs_id)
VALUES (5000059,3,1,4);

INSERT INTO cpl_parcel_dimen (ztrn_id, id, zpar_id, zobs_id)
VALUES (5000059,4,1,6);

INSERT INTO cpl_sur_admin_area (ztrn_id, crs_stt_id)
VALUES (5000059,1027);

INSERT INTO crs_lw_rel_editor (id, usr_id_related, related_person_typ, related_category, ttin_id, zsur_ztrn_id, usr_id_rel_firm, related_role, related_multi_role_id)
VALUES (52100166,'extsurv1','SURV','SURV',NULL,5000059,'firm4',NULL,1);

INSERT INTO crs_lw_rel_editor (id, usr_id_related, related_person_typ, related_category, ttin_id, zsur_ztrn_id, usr_id_rel_firm, related_role, related_multi_role_id)
VALUES (52100167,'extsurv1','ENBL','SURV',NULL,5000059,'firm4',NULL,1);

INSERT INTO crs_lw_rel_editor (id, usr_id_related, related_person_typ, related_category, ttin_id, zsur_ztrn_id, usr_id_rel_firm, related_role, related_multi_role_id)
VALUES (52100168,'extsurv1','PCNT','SURV',NULL,5000059,'firm4',NULL,1);

INSERT INTO cpg_xml_file (ztrn_id, refresh_xml_file, xml_file, xml_changed, xml_datetime, usr_id_modified, date_modified)
VALUES (5000059, 'N', filetoblob('../data/5000059_xml.xml','client'), 'N', '2024-05-09 09:33:47', 'extsurv1', '2024-04-12 13:48:11');

-- manually added.
-- RT Boundary and Abuttal lines added by the surveyor
INSERT INTO crs_dig_plan_line(ztrn_id, id, lin_id, shape, se_row_id, symbology)
VALUES (5000059, 5000059, null, ST_GeomFromText('LINESTRING (10.9908477667 -45.0692894167, 10.9912594833 -45.0690421333)', 1), 5000059, 1 );

INSERT INTO crs_dig_plan_line(ztrn_id, id, lin_id, shape, se_row_id, symbology)
VALUES (5000059, 5100060, null, ST_GeomFromText('LINESTRING (10.9909477667 -45.0693894167, 10.9913594833 -45.0691421333)', 1), 5000059, 2 );

-- Add diagrams so that we don't prepare dataset in the test
INSERT INTO cpg_diagram (ztrn_id, id, name_parent_id, diag_name, diagram_type, ppge_id, zoom_scale, origin_page_offset,
                         diag_origin_x, diag_origin_y, diag_height, diag_width, cos_id, shape, se_row_id,
                         layout_parent_id, list_seq)
VALUES (5000059, 1, null, 'System Generated Primary Diagram', 'SYSP', null, 164.00, '0.0217640709 -0.0155386445', null, null, null, null, null,
        '1 POLYGON ((10.9907484333 -45.0690057167, 10.9907485833 -45.0690104333, 10.99074905 -45.0690151167, 10.9907498167 -45.0690197667, 10.9907508833 -45.06902435, 10.99075225 -45.0690288667, 10.9907539167 -45.0690332667, 10.99075585 -45.0690375667, 10.9907580833 -45.0690417167, 10.9907605667 -45.0690457167, 10.9907633167 -45.06904955, 10.9907663 -45.0690531833, 10.9907663 -45.0690532, 10.9907695167 -45.0690566333, 10.99077295 -45.06905985, 10.9907729667 -45.06905985, 10.9907766 -45.0690628333, 10.9907804333 -45.0690655833, 10.9907844333 -45.0690680667, 10.9907885833 -45.0690703, 10.9907892833 -45.0690706333, 10.9912531667 -45.0692932333, 10.9912567667 -45.0692948333, 10.9912611667 -45.0692965, 10.9912656833 -45.0692978667, 10.9912702667 -45.0692989333, 10.9912749167 -45.0692997, 10.9912796 -45.0693001667, 10.9912843167 -45.0693003167, 10.9912890333 -45.0693001667, 10.9912937167 -45.0692997, 10.9912983667 -45.0692989333, 10.99130295 -45.0692978667, 10.9913074667 -45.0692965, 10.9913118667 -45.0692948333, 10.9913161667 -45.0692928833, 10.9913203167 -45.0692906667, 10.9913243167 -45.0692881833, 10.99132815 -45.0692854333, 10.9913317833 -45.06928245, 10.9913352333 -45.0692792333, 10.9913372333 -45.0692771333, 10.9914667167 -45.06913675, 10.9914679333 -45.0691354, 10.9914709167 -45.0691317667, 10.9914736667 -45.0691279333, 10.99147615 -45.0691239333, 10.9914783667 -45.0691197833, 10.9914803167 -45.0691154833, 10.9914819667 -45.0691110833, 10.9914819667 -45.0691110667, 10.9914833333 -45.0691065667, 10.9914844167 -45.0691019833, 10.9914851833 -45.0690973333, 10.9914856333 -45.06909265, 10.9914858 -45.0690879333, 10.9914856333 -45.0690832167, 10.9914851833 -45.0690785333, 10.9914844167 -45.0690738833, 10.9914833333 -45.0690693, 10.9914819667 -45.0690648, 10.9914819667 -45.0690647833, 10.9914803167 -45.0690603833, 10.9914783667 -45.0690560833, 10.99147615 -45.0690519333, 10.9914736667 -45.0690479333, 10.9914709167 -45.0690441, 10.9914679333 -45.0690404667, 10.9914647 -45.0690370333, 10.9914612667 -45.0690338, 10.9914576333 -45.0690308167, 10.9914538 -45.0690280667, 10.9914498 -45.0690255833, 10.9914487333 -45.0690249833, 10.9910269167 -45.0687908833, 10.9910238333 -45.0687892667, 10.9910195333 -45.0687873167, 10.9910151167 -45.0687856667, 10.9910106167 -45.0687843, 10.9910060333 -45.0687832167, 10.9910013833 -45.06878245, 10.9909967 -45.068782, 10.9909919833 -45.0687818333, 10.9909872667 -45.0687819833, 10.9909825833 -45.06878245, 10.9909779333 -45.0687832167, 10.99097335 -45.0687842833, 10.9909688333 -45.06878565, 10.9909644333 -45.0687873167, 10.9909601333 -45.0687892667, 10.9909559833 -45.0687914833, 10.9909519833 -45.0687939667, 10.99094815 -45.0687967167, 10.9909445167 -45.0687997, 10.99094425 -45.0687999333, 10.99077295 -45.0689515833, 10.9907727 -45.0689518167, 10.9907695167 -45.0689548, 10.9907663 -45.0689582333, 10.9907663 -45.06895825, 10.9907633167 -45.0689618833, 10.9907605667 -45.0689657167, 10.9907580833 -45.0689697167, 10.99075585 -45.0689738667, 10.9907539167 -45.0689781667, 10.99075225 -45.0689825667, 10.9907508833 -45.0689870833, 10.9907498167 -45.0689916667, 10.99074905 -45.0689963167, 10.9907485833 -45.069001, 10.9907484333 -45.0690057167))',
        1, null, 1);

INSERT INTO cpg_diagram (ztrn_id, id, name_parent_id, diag_name, diagram_type, ppge_id, zoom_scale, origin_page_offset,
                         diag_origin_x, diag_origin_y, diag_height, diag_width, cos_id, shape, se_row_id,
                         layout_parent_id, list_seq)
VALUES (5000059, 2, null, 'System Generated Traverse Diagram', 'SYST', null, 357.00, '0.015 -0.015', null, null, null, null, null,
        '1 MULTIPOLYGON (((10.9907484333 -45.0690057167, 10.9907485833 -45.0690104333, 10.99074905 -45.0690151167, 10.9907498167 -45.0690197667, 10.9907508833 -45.06902435, 10.99075225 -45.0690288667, 10.9907539167 -45.0690332667, 10.99075585 -45.0690375667, 10.9907580833 -45.0690417167, 10.9907605667 -45.0690457167, 10.9907633167 -45.06904955, 10.9907663 -45.0690531833, 10.9907663 -45.0690532, 10.9907695167 -45.0690566333, 10.99077295 -45.06905985, 10.9907729667 -45.06905985, 10.9907766 -45.0690628333, 10.9907804333 -45.0690655833, 10.9907844333 -45.0690680667, 10.9907885833 -45.0690703, 10.9907892833 -45.0690706333, 10.9912531667 -45.0692932333, 10.9912567667 -45.0692948333, 10.9912611667 -45.0692965, 10.9912656833 -45.0692978667, 10.9912702667 -45.0692989333, 10.9912749167 -45.0692997, 10.9912796 -45.0693001667, 10.9912843167 -45.0693003167, 10.9912890333 -45.0693001667, 10.9912937167 -45.0692997, 10.9912983667 -45.0692989333, 10.99130295 -45.0692978667, 10.9913074667 -45.0692965, 10.9913118667 -45.0692948333, 10.9913161667 -45.0692928833, 10.9913203167 -45.0692906667, 10.9913243167 -45.0692881833, 10.99132815 -45.0692854333, 10.9913317833 -45.06928245, 10.9913352333 -45.0692792333, 10.9913372333 -45.0692771333, 10.9913745 -45.0692367333, 10.99157765 -45.0691935, 10.9915790167 -45.0691931667, 10.9915807167 -45.06919265, 10.9915823667 -45.0691920333, 10.9915839833 -45.0691913, 10.9915855333 -45.0691904667, 10.9915870333 -45.0691895333, 10.9915884667 -45.0691885167, 10.9915898333 -45.0691873833, 10.9915911333 -45.0691861833, 10.9915923333 -45.0691848833, 10.9915934667 -45.0691835167, 10.9915944833 -45.0691820833, 10.9915954167 -45.0691805833, 10.99159625 -45.0691790333, 10.9915969833 -45.0691774167, 10.9915976 -45.0691757667, 10.9915981167 -45.0691740667, 10.9915985167 -45.06917235, 10.9915988167 -45.0691706167, 10.9915989833 -45.06916885, 10.9915990333 -45.0691670833, 10.9915989833 -45.0691653167, 10.9915988 -45.0691635667, 10.9915985167 -45.0691618167, 10.9915981167 -45.0691601, 10.9915976 -45.0691584, 10.9915969833 -45.06915675, 10.99159625 -45.0691551333, 10.9915954167 -45.0691535833, 10.9915944833 -45.0691520833, 10.99159345 -45.06915065, 10.9915923333 -45.0691492833, 10.9915911333 -45.0691479833, 10.9915898333 -45.0691467833, 10.9915884667 -45.0691456667, 10.9915870333 -45.0691446333, 10.9915855333 -45.0691437, 10.9915841167 -45.0691429333, 10.9914855333 -45.0690936167, 10.9914856333 -45.06909265, 10.9914858 -45.0690879333, 10.9914856333 -45.0690832167, 10.9914851833 -45.0690785333, 10.9914844167 -45.0690738833, 10.9914833333 -45.0690693, 10.9914819667 -45.0690648, 10.9914819667 -45.0690647833, 10.9914803167 -45.0690603833, 10.9914783667 -45.0690560833, 10.99147615 -45.0690519333, 10.9914736667 -45.0690479333, 10.9914709167 -45.0690441, 10.9914679333 -45.0690404667, 10.9914647 -45.0690370333, 10.9914612667 -45.0690338, 10.9914576333 -45.0690308167, 10.9914538 -45.0690280667, 10.9914498 -45.0690255833, 10.9914487333 -45.0690249833, 10.9910269167 -45.0687908833, 10.9910238333 -45.0687892667, 10.9910195333 -45.0687873167, 10.9910151167 -45.0687856667, 10.9910106167 -45.0687843, 10.9910060333 -45.0687832167, 10.9910013833 -45.06878245, 10.9909967 -45.068782, 10.9909919833 -45.0687818333, 10.9909872667 -45.0687819833, 10.9909825833 -45.06878245, 10.9909779333 -45.0687832167, 10.99097335 -45.0687842833, 10.9909688333 -45.06878565, 10.9909644333 -45.0687873167, 10.9909601333 -45.0687892667, 10.9909559833 -45.0687914833, 10.9909519833 -45.0687939667, 10.99094815 -45.0687967167, 10.9909445167 -45.0687997, 10.99094425 -45.0687999333, 10.99077295 -45.0689515833, 10.9907727 -45.0689518167, 10.9907695167 -45.0689548, 10.9907663 -45.0689582333, 10.9907663 -45.06895825, 10.9907633167 -45.0689618833, 10.9907605667 -45.0689657167, 10.9907580833 -45.0689697167, 10.99075585 -45.0689738667, 10.9907539167 -45.0689781667, 10.99075225 -45.0689825667, 10.9907508833 -45.0689870833, 10.9907498167 -45.0689916667, 10.99074905 -45.0689963167, 10.9907485833 -45.069001, 10.9907484333 -45.0690057167)))',
        2, null, 1);

-- lock transaction
execute procedure cp_ccl_setSessionContext('extsurv1', '', 0);
execute procedure cp_cdb_lock_rows_nosession(
  cf_cdb_lock_start_nosession('SURV', 'test lock 5000059'),
  'cpl_transaction',
  'id=5000059'
);
execute procedure cp_ccl_setSessionContext('', '', 0);
