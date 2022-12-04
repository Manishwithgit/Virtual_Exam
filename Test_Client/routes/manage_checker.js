const router = require('express').Router();
const pool = require('../config/database');


router.get('/', async function(req,res){
  try{
    let sql1,sql2;
    if(req.user.type==0)
    {
      sql1="SELECT a.user_id AS user_id,a.name AS name,a.user_name AS username,a.password AS password,a.client_id AS client_id,a.mob_no AS mob_no FROM checker_details AS a";
      sql2="SELECT a.exam_id,a.exam_name FROM exam AS a";
    }
    else {
      sql1="SELECT a.user_id AS user_id,a.name AS name,a.user_name AS username,a.password AS password,a.client_id AS client_id,a.mob_no AS mob_no FROM checker_details AS a WHERE a.client_id='"+req.user.client_id+"'";
      sql2="SELECT a.exam_id,a.exam_name FROM exam AS a WHERE a.client_id='"+req.user.client_id+"'";
    }
    const result = await pool.query("SELECT a.sub_id AS sub_id,a.sub_name AS sub_name FROM subject AS a");
    const result1 = await pool.query(sql1);
    const result2 = await pool.query(sql2);
    const result3 = await pool.query("SELECT client_id,client_name FROM client_details");
    res.render('manage_checker.ejs',{
      users:result1,
      exam:result2,
      subject:result,
      id:6,
      type:req.user.type,
      name:result3
    });
  }catch(err){
    throw err;
  }
});




//AJAX Call
router.post('/option',async function(req,res){
  try{
    let sql;
console.log("sdf");
    if(req.user.type==0)
    {
      sql="SELECT a.sub_name FROM exam AS a WHERE a.exam_id='"+req.body.exam+"'";
    }else {
      sql="SELECT a.sub_name FROM exam AS a WHERE a.exam_id='"+req.body.exam+"' AND a.client_id='"+req.user.client_id+"'";
    }
    const result = await pool.query(sql);
    console.log(result);
    const result1 = await pool.query("SELECT a.sub_id FROM subject AS a");
    res.send({
      user:result
       });
  }catch(err){
    throw err;
  }
});
//End Of Ajax Call

router.post('/details',async function(req,res){
  try{
    const result = await pool.query("SELECT a.user_id,b.user_name,b.mob_no,b.password,b.type FROM checker_details AS a INNER JOIN login_table AS b ON a.user_id=b.checker_id WHERE b.username='"+req.body.username+"'");    console.log(result);
    if(result.length>0){ 
      if(result[0].type != 3){
        res.send({flag:1,user:''})
      }else{
        res.send({
          user:result,
          flag:0
        })
      }
    }else{
      res.send({
        user:result,
        flag:0
      })
    }
  }catch(err){
    throw err;
  }
});


router.post('/',async function(req,res){
  try{
    console.log(req.body);
    var sub=req.body.subject;
    if(req.body.user_id== 0)
    {
      const result = await pool.query("INSERT IGNORE INTO `checker_details`(`name`,`mob_no`,`user_name`,`password`,`client_id`) VALUES ('"+req.body.name+"','"+req.body.mob+"','"+req.body.username+"','"+req.body.password+"','"+req.user.client_id+"')");
      console.log(result);
      
      let checker_id = result.insertId;
      const result2 = await pool.query("INSERT IGNORE INTO `checker_map`(`checker_id`,`exam_id`,`sub_id`) VALUES ('"+checker_id+"','"+req.body.exam+"','"+req.body.subject+"')");
      console.log(result2);

      const result1 = await pool.query("INSERT IGNORE INTO `login_table`(`user_name`,`checker_id`,`mob_no`,`username`,`password`,`type`,`client_id`) VALUES ('"+req.body.name+"','"+checker_id+"','"+req.body.mob+"','"+req.body.username+"','"+req.body.password+"','"+2+"','"+req.user.client_id+"')");
      console.log(result1);

      const result3 = await pool.query("ALTER TABLE `res_"+req.body.exam+"` ADD `ch_"+checker_id+"` int(10) DEFAULT 0");
      console.log(result3);

      res.redirect('/manage_checker');
    }
    else 
    {
      const result4 = await pool.query("INSERT IGNORE INTO `checker_map`(`checker_id`,`exam_id`,`sub_id`) VALUES ('"+req.body.user_id+"','"+req.body.exam+"','"+req.body.subject+"')");
      if(result4.insertId == 0) {
        const result3 = await pool.query("UPDATE `checker_map` SET `sub_id`='"+req.body.subject+"' WHERE `exam_id`="+req.body.exam+" AND `checker_id`="+req.body.user_id+"");
        
        const result5 = await pool.query("ALTER TABLE `res_"+req.body.exam+"` ADD `ch_"+req.body.user_id+"` int(10) DEFAULT 0");
        console.log(result5);    
      }
      res.redirect('/manage_checker');
    }
  }catch(err){
    throw err;
  }
});

module.exports = router;
