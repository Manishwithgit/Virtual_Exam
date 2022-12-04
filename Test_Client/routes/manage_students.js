const router = require('express').Router();
const moment = require('moment');
const pool = require('../config/database');

router.get('/', async function(req,res){
  try{
      let sql;
	    if(req.user.type==0) {
         sql="SELECT a.exam_id AS exam_id, a.exam_name AS exam_name, a.date FROM exam AS a WHERE a.date >= CURRENT_DATE()";
         sql2="SELECT  M.reg_no,M.exam_id, E.exam_name,S.stu_name,S.adm_no,S.roll_no FROM `stu_map` M JOIN exam E on M.exam_id = E.exam_id JOIN student_details S on M.id = S.stu_id WHERE M.completed="+0+" AND E.date >= CURRENT_DATE()";
	    }else {
         sql="SELECT a.exam_id AS exam_id,a.exam_name AS exam_name, a.date FROM exam AS a WHERE a.client_id='"+req.user.client_id+"' AND a.date >= CURRENT_DATE()";
         sql2="SELECT  M.reg_no,M.exam_id, E.exam_name,S.stu_name,S.adm_no,S.roll_no FROM `stu_map` M JOIN exam E on M.exam_id = E.exam_id JOIN student_details S on M.id = S.stu_id WHERE M.completed="+0+" AND E.date >= CURRENT_DATE() AND E.client_id="+req.user.client_id+"";
      }
      console.log(sql,sql2)
      const result = await pool.query(sql);
      const result2 = await pool.query(sql2);
      result.forEach(res => {
        res.date = moment(res.date).format('YYYYMMDD');
      })
      // console.log(results[0])
	    res.render('manage_students.ejs',{
	      exam:result,
	      id:5,
	      type:req.user.type,
	      students:result2,
	      msg: req.flash('msg')
      });
      
  }catch(err){
    throw err;
  }
});

//AJAX Call
router.post('/details',async function(req,res){
  try{
      const result = await pool.query("SELECT * FROM student_details AS a WHERE adm_no='"+req.body.adm_no+"'");
        console.log(result);
       	res.send({
         	user:result
        });
    }catch(err){
      throw err;
    } 
});
//End Of Ajax Call


router.post('/add_student',async function(req,res){
    let [exam_id, exam_date] = req.body.exam.split('~');
    if(req.body.stu_id == 0) {
        const result = await pool.query("INSERT INTO `student_details`(`stu_name`,`adm_no`,`guardian_no`,`guardian_name`,`class`,`sec`,`roll_no`,`client_id`) VALUES ('"+req.body.name+"','"+req.body.adm_no+"','"+req.body.guardian_no+"','"+req.body.guardian_name+"','"+req.body.class+"','"+req.body.sec+"','"+req.body.roll_no+"','"+req.user.client_id+"')");
        	let stu_id = result.insertId;
          let x = exam_id+"/"+exam_date+"/"+stu_id;

            const result3 = await pool.query("INSERT INTO `stu_map`(`id`,`reg_no`,`exam_id`) VALUES ('"+stu_id+"','"+x+"','"+exam_id+"')");
            const result4 = await pool.query("INSERT INTO `stu_map_1`(`id`,`reg_no`,`exam_id`) VALUES ('"+stu_id+"','"+x+"','"+exam_id+"')");
            console.log(result3);
            res.redirect('/manage_students');
     }
     else if(req.body.stu_id > 0) 
     {
      let x = exam_id+"/"+exam_date+"/"+req.body.stu_id;
     	const result3 = await pool.query("INSERT IGNORE INTO `stu_map`(`id`,`reg_no`,`exam_id`) VALUES ('"+req.body.stu_id+"','"+x+"','"+exam_id+"')");
        const result4 = await pool.query("INSERT IGNORE INTO `stu_map_1`(`id`,`reg_no`,`exam_id`) VALUES ('"+req.body.stu_id+"','"+x+"','"+exam_id+"')");
 
	    if(result3.insertId == 0)
			{
          console.log("Im here");
	    		req.flash('msg', 'This User Is Already Added To The Exam!');
         	res.redirect('/manage_students');
      }
      else {
          console.log("here");
	    		console.log(result3);
	    		res.redirect('/manage_students');
	    	}
     }
});

module.exports = router;
