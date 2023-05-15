// ��װ����layer�����
var common_ops = {
  alert:function( msg ,cb ){
      layer.alert( msg,{
          yes:function( index ){
              if( typeof cb == "function" ){
                  cb();
              }
              layer.close( index );
          }
      });
  },
  confirm:function( msg,callback ){
      callback = ( callback != undefined )?callback: { 'ok':null, 'cancel':null };
      layer.confirm( msg , {
          btn: ['ȷ��','ȡ��'] //��ť
      }, function( index ){
          //ȷ���¼�
          if( typeof callback.ok == "function" ){
              callback.ok();
          }
          layer.close( index );
      }, function( index ){
          //ȡ���¼�
          if( typeof callback.cancel == "function" ){
              callback.cancel();
          }
          layer.close( index );
      });
  },
  tip:function( msg,target ){
      layer.tips( msg, target, {
          tips: [ 3, '#e5004f']
      });
      $('html, body').animate({
          scrollTop: target.offset().top - 10
      }, 100);
  }
};


// ����
$(document).ready(function() {
  var chatBtn = $('#chatBtn');
  var chatInput = $('#chatInput');
  var chatWindow = $('#chatWindow');

  // �洢�Ի���Ϣ,ʵ�������Ի�
  var messages = [];

  // ����Ƿ���html����ı�־����
  var checkHtmlFlag = false;

  // ��鷵�ص���Ϣ�Ƿ�����ȷ��Ϣ
  var resFlag = true

  // ת��html����(��Ӧ�ַ�ת��Ϊhtmlʵ��)����ֹ���������Ⱦ
  function escapeHtml(html) {
    let text = document.createTextNode(html);
    let div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML;
  }

  // �ж���������Ƿ����html��ǩ
  function checkHtmlTag(str) {
    let pattern = /<\s*\/?\s*[a-z]+(?:\s+[a-z]+=(?:"[^"]*"|'[^']*'))*\s*\/?\s*>/i;  // ƥ��HTML��ǩ��������ʽ
    return pattern.test(str); // ����ƥ����
  }
  
  // ���������Ϣ������
  function addRequestMessage(message) {
    $(".tips").css({"display":"none"});    // ���Ϳ�����
    chatInput.val('');
    let escapedMessage = escapeHtml(message);  // ������message����ת�壬��ֹ�������html�����������Ⱦ
    let requestMessageElement = $('<br><br><div class="row message-bubble"><div class="message-text request">' +  escapedMessage + '</div><img class="me" src="User.png"></div>');
    chatWindow.append(requestMessageElement);
    let responseMessageElement = $('<br><br><div class="row message-bubble"><img class="chatGPT" src="ChatGPT.png"><span>&nbsp;Flutas ChatGPT AI<div class="message-text response"><p>Reposeing...</p></div></div><br><br><br><br>');
    chatWindow.append(responseMessageElement);
    window.scrollTo(0, document.documentElement.scrollHeight);
    chatWindow.animate({ scrollTop: chatWindow.prop('scrollHeight') }, 500);
  }
  
  // �����Ӧ��Ϣ������,��ʽ��Ӧ�˷�����ִ�ж��
  function addResponseMessage(message) {
    let lastResponseElement = $(".message-bubble .response").last();
    lastResponseElement.empty();
    let escapedMessage;
    if(checkHtmlTag(message)){  // �����html����
      escapedMessage = marked(escapeHtml(message)); 
      checkHtmlFlag = true;
    }else{
      escapedMessage = marked(message);  // ��Ӧ��Ϣmarkdownʵʱת��Ϊhtml
      checkHtmlFlag = false;
    }
    var Messgaex = escapedMessage.replace(/GPT/g, 'Flutas ChatGPT AI');
    lastResponseElement.append(Messgaex);
    chatWindow.scrollTop(chatWindow.prop('scrollHeight'));
    if(document.querySelector('code') != null) {
     hljs.highlightAll();
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  }

  // ���ʧ����Ϣ������
  function addFailMessage(message) {
    let lastResponseElement = $(".message-bubble .response").last();
    lastResponseElement.empty();
    lastResponseElement.append(message);
    chatWindow.scrollTop(chatWindow.prop('scrollHeight'));
    window.scrollTo(0, document.documentElement.scrollHeight);
    messages.pop() // ʧ�ܾ����û�������Ϣ������ɾ��
  }
  

  // ������������Ӧ
  //������ַhttps://openai.1rmb.tk/v1/chat/completions��https://api.openai.com/v1/chat��https://open.aiproxy.xyz/v1/chat/completions
//����Ҫ��дapi key����ַ(Э��http) http://152.32.207.62/v1/chat/completions
  async function sendRequest(data) {
    const response = await fetch('http://152.32.207.62/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + data.apiKey,
        'User-Agent': 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT10.0; Trident/5.0)',
      },
      body: JSON.stringify({
        "messages": data.prompt,
        "model": "gpt-3.5-turbo",
        "max_tokens": 2048,
        "temperature": 0.5,
        "top_p": 1,
        "n": 1,
        "stream": true
      })
    }); 
  
    const reader = response.body.getReader();
    let res;
    let str = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      res = new TextDecoder().decode(value).replace(/^data: /gm, '').replace("[DONE]",'');
      const lines = res.trim().split(/[\n]+(?=\{)/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const jsonObj = JSON.parse(line);
        if (jsonObj.choices && jsonObj.choices[0].delta.content) {
          str += jsonObj.choices[0].delta.content;
          addResponseMessage(str);
          resFlag = true;
        }else{
          if(jsonObj.error){
            addFailMessage('<p class="error">��Ǹ,ChatGPT��������. ' + jsonObj.error.type + " : " + jsonObj.error.message + '</p>');
            resFlag = false;
          }
        } 
      }
      if(document.querySelector('code') != null) {
      }
    }
    return str;
  }

  // �����û�����
  chatBtn.click(function() {
    // �������¼�
    chatInput.off("keydown",handleEnter);
    
    // ����api key��Ի�����
    let data = {
      "apiKey" : "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", // ������д�̶� apiKey
    }
   
    // �ж��Ƿ�ʹ���Լ���api key
    if ($(".key .ipt-1").prop("checked")){
      var apiKey = $(".key .ipt-2").val();
      if (apiKey.length < 20 ){
          common_ops.alert("��������ȷ�� api key ��",function(){
            chatInput.val('');
            // ���°󶨼����¼�
            chatInput.on("keydown",handleEnter);
          })
          return
      }else{
        data.apiKey = apiKey;
      }

    }

    let message = chatInput.val();
    if (message.length == 0){
      common_ops.alert("���������ݣ�",function(){
        chatInput.val('');
        // ���°󶨼����¼�
        chatInput.on("keydown",handleEnter);
      })
      return
    }

    addRequestMessage(message);
    // ���û���Ϣ���浽����
    messages.push({"role": "user", "content": message})
    // �յ��ظ�ǰ�ð�ť���ɵ��
    chatBtn.attr('disabled',true)

    data.prompt = messages;
    
    sendRequest(data).then((res) => {
      if(resFlag){
        messages.push({"role": "assistant", "content": res});
      }
      // �յ��ظ����ð�ť�ɵ��
      chatBtn.attr('disabled',false)
      // ���°󶨼����¼�
      chatInput.on("keydown",handleEnter); 
      if (checkHtmlFlag) {
        let lastResponseElement = $(".message-bubble .response").last();
        let lastResponseHtml = lastResponseElement.html();
        let newLastResponseHtml = lastResponseHtml.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/'/g, "'").replace(/&quot;/g, "\"");
        lastResponseElement.html(newLastResponseHtml);
      }
    });

  });  

  // Enter�����¼�
  function handleEnter(e){
    if (e.keyCode==13){
      document.querySelector('.tip').setAttribute('style',"display:none");
      chatBtn.click();
      e.preventDefault();  //����س�����
    }
  }

  // ��Enter�����¼�
  chatInput.on("keydown",handleEnter);
  
  // // �����Ҽ��˵�
  // document.addEventListener('contextmenu',function(e){
  //   e.preventDefault();  // ��ֹĬ���¼�
  // });

  // // ��ֹ����F12��
  // document.addEventListener('keydown',function(e){
  //   if(e.key == 'F12'){
  //       e.preventDefault(); // ������¼�F12,��ֹ�¼�
  //   }
  // });
});

function copy(obj) {
 let btn = $(obj)
 let h = $(btn).parent();
 let temp = $("<textarea></textarea>");
        //���⸴������ʱ�Ѱ�ť����Ҳ���ƽ�ȥ������ʱ�ÿ�
        btn.text("");
        temp.text(h.text());
        temp.appendTo(h);
        temp.select();
        document.execCommand("Copy");
        temp.remove();
        btn.val('���Ƴɹ�');
        setTimeout(()=> {
            btn.val('���ƴ���');
        },1500);
}

function AddCodeCopy(){
        let preList = $('code[class*="hljs.language"');
    for (let pre of preList) {
        //��ÿ������������ϡ����ƴ��롱��ť
        let btn = $("<span class=\"btn-pre-copy\" onclick='copy(this)'>���ƴ���</span>");
        btn.prependTo(pre);
    }
    }