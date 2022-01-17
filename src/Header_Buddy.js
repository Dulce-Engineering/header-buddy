import 'https://www.gstatic.com/firebasejs/ui/4.8.0/firebase-ui-auth.js'

class Header_buddy extends HTMLElement 
{
  static tname = "header-buddy";
  static user_key = "Header-Buddy.user";

  // Lifecycle ====================================================================================

  constructor() 
  {
    super();

    this.On_Auth_State_Changed = this.On_Auth_State_Changed.bind(this);
    this.On_Sign_In_Clicked = this.On_Sign_In_Clicked.bind(this);
    this.On_Sign_Out_Clicked = this.On_Sign_Out_Clicked.bind(this);
    this.On_Acc_Clicked = this.On_Acc_Clicked.bind(this);
    this.On_User_Is_Signing_In = this.On_User_Is_Signing_In.bind(this);

    this.attachShadow({mode: "open"});
  }

  connectedCallback()
  {
    this.Render();
  }

  disconnectedCallback()
  {
  }

  adoptedCallback()
  {
  }

  static observedAttributes = ["title"];
  attributeChangedCallback(attr_name, old_value, new_value)
  {
    if (attr_name == "title")
    {
      this.init_title = new_value;
      this.title = new_value;
    }
  }

  // Fields =======================================================================================

  set title(value)
  {
    if (value)
    {
      const title_span = this.shadowRoot.querySelector("#title_span");
      if (title_span)
      {
        title_span.innerText = value;
      }
    }
  }

  set fb_ctx(value)
  {
    this.Init(value);
  }

  // API ==========================================================================================

  Init(ctx, on_signed_in_fn, on_signed_out_fn)
  {
    if (on_signed_in_fn)
      header_elem.addEventListener("signedin", on_signed_in_fn);
    if (on_signed_out_fn)
      header_elem.addEventListener("signedout", on_signed_out_fn);

    this.ctx = ctx;
    this.ui = new firebaseui.auth.AuthUI(this.ctx.fb_auth);

    const user = this.Get_Logged_In_User();
    if (user)
    {
      this.On_Auth_State_Changed(user, true);
    }
    else
    {
      this.Set_OnAuthStateChanged();
    }
  }

  Get_Logged_In_User()
  {
    let user;
    const user_str = localStorage.getItem(Header_buddy.user_key);
    if (user_str)
    {
      user = JSON.parse(user_str);
      const now = Date.now();
      if (now >= user.expireAt)
        user = null;
    }

    return user;
  }

  Set_OnAuthStateChanged()
  {
    if (!this.onAuthStateChanged_set)
    {
      this.ctx.fb_auth.onAuthStateChanged(this.On_Auth_State_Changed);
      this.onAuthStateChanged_set = true;
    }
  }

  Sign_In(signin_fn)
  {
    let signInSuccessWithAuthResult = function (auth_result, redirect_url)
    {
      return false;
    };

    if (signin_fn)
    {
      signInSuccessWithAuthResult = function (auth_result, redirect_url)
      {
        const display_name = auth_result.user.displayName;
        this.Render_Signed_In(display_name);
      };
      signInSuccessWithAuthResult = signInSuccessWithAuthResult.bind(this);
    }

    const auth_ui_config = 
    {
      callbacks:
      {
        signInSuccessWithAuthResult,
        uiShown: this.On_User_Is_Signing_In
      },
      signInFlow: 'popup',
      signInOptions: [
        firebase.auth.EmailAuthProvider.PROVIDER_ID,
      ],
    };

    const auth_id = "firebaseui-auth-container";
    let auth_div = document.getElementById(auth_id);
    if (!auth_div)
    {
      auth_div = document.createElement("div");
      auth_div.id = auth_id;
      document.body.append(auth_div);
    }
    this.ui.start('#' + auth_id, auth_ui_config);
  }
  
  // Events =======================================================================================

  On_Auth_State_Changed(user, skip_user_update)
  {
    this.ctx.user = user;
    if (user)
    {
      this.On_User_Has_Signed_In(user);
      if (!skip_user_update)
      {
        const now = Date.now();
        const day = 86400000;
        user.expireAt = now + day;
        const user_str = JSON.stringify(user);
        localStorage.setItem(Header_buddy.user_key, user_str);
      }
    }
    else
    {
      this.On_User_Has_Signed_Out();
      localStorage.removeItem(Header_buddy.user_key);
    }
  }

  On_User_Has_Signed_In(user)
  {
    this.Render_Signed_In(user.displayName);
    const event = new CustomEvent('signedin', {detail: user});
    this.dispatchEvent(event);
  }

  On_User_Has_Signed_Out()
  {
    Header_buddy.Show("signin_info", this.shadowRoot);
    Header_buddy.Hide("user_info", this.shadowRoot);
    const event = new Event('signedout');
    this.dispatchEvent(event);
  }

  On_Sign_In_Clicked()
  {
    this.Sign_In();
    this.Set_OnAuthStateChanged();
  }

  On_Sign_Up_Clicked()
  {
    window.open("user.html", "_self");
  }

  async On_Sign_Out_Clicked()
  {
    if (this.ctx)
    {
      await this.ctx.fb_auth.signOut();
      this.Set_OnAuthStateChanged();
    }
  }

  On_User_Is_Signing_In() 
  {
    Header_buddy.Hide("signin_info", this.shadowRoot);
    Header_buddy.Hide("user_info", this.shadowRoot);
  }

  On_Acc_Clicked()
  {
    if (this.ctx)
    {
      const uid = this.ctx.fb_auth.currentUser.uid;
      window.open("user.html?uid=" + uid, "_self");
    }
  }

  On_Main_Menu_Clicked(event)
  {
    if (event.detail.title == "Home")
    {
      window.open("/admin/index.html", "_self");
    }
    if (event.detail.title == "Registration Forms")
    {
      window.open("/admin/reg_forms.html", "_self");
    }
  }

  // Rendering ====================================================================================

  Render_Signed_In(display_name)
  {
    const elem = this.shadowRoot.querySelector("#user_name");
    elem.innerText = display_name;

    Header_buddy.Hide("signin_info", this.shadowRoot);
    Header_buddy.Show("user_info", this.shadowRoot);
  }

  Render()
  {
    this.classList.add("bk-header");
    const html = `
      <link type="text/css" rel="stylesheet" href="../src/styles.css"/>
      <xmenu-buddy-panel id="main_menu2" menu-style-src="/components/menu-panel.css"></xmenu-buddy-panel>

      <div id="bk-header-bar">
        <menu-buddy-btn id="main_menu" xbtn-style-src="/components/menu-btn.css" show-pos="bottom">
          <ximg src="/images/menu_teal_24dp.svg">
          Menu
        </menu-buddy-btn>
        <span id="title" class="bk-header-title">
          <a href="/"><span>BrandKind</span></a> - <span id="title_span"></span>
        </span>
      </div>

      <div id="btn_bar" class="bk-header-action">
        <div id="user_info" class="bk-header-user">
          <span></span>
          <span id="user_name"></span>
          <button id="acc_btn">Account</button>
          <button id="sign_out_btn">Sign Out</button>
        </div>
        <div id="signin_info" class="bk-header-signin">
          <!--button id="sign_up_btn">Sign Up</button-->
          <button id="sign_in_btn">Sign In</button>
        </div>
      </div>`;
    const doc = Header_buddy.toDocument(html);
    this.shadowRoot.append(doc);

    const m =
    {
      title: "BrandKind",
      class_name: "menu",
      options: 
      [
        {title: "Home"}, 
        {title: "Registration Forms"}
      ]
    };

    const main_menu = this.shadowRoot.querySelector("#main_menu");
    main_menu.menu = m;
    main_menu.menu_buddy.style.width = "200px";
    main_menu.menu_buddy.addEventListener("clickoption", this.On_Main_Menu_Clicked);

    const sign_in_btn = this.shadowRoot.querySelector("#sign_in_btn");
    sign_in_btn.addEventListener("click", this.On_Sign_In_Clicked);

    //const sign_up_btn = this.shadowRoot.querySelector("#sign_up_btn");
    //sign_up_btn.addEventListener("click", this.On_Sign_Up_Clicked);

    const sign_out_btn = this.shadowRoot.querySelector("#sign_out_btn");
    sign_out_btn.addEventListener("click", this.On_Sign_Out_Clicked);

    const acc_btn = this.shadowRoot.querySelector("#acc_btn");
    acc_btn.addEventListener("click", this.On_Acc_Clicked);

    this.title = this.init_title;
  }
  
  // Utils ========================================================================================

  static toDocument(html) 
  {
    var template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content;
  }
  
  static Show(id, parent_elem)
  {
    if (!parent_elem)
    {
      parent_elem = document;
    }

    const elem = parent_elem.querySelector("#" + id);
    if (elem)
    {
      elem.style.removeProperty("display");
      const def_display = getComputedStyle(elem).getPropertyValue("--def-display");
      if (def_display)
      {
        elem.style.display = def_display;
      }
    }
  }

  static Hide(id, parent_elem)
  {
    if (!parent_elem)
    {
      parent_elem = document;
    }

    const elem = parent_elem.querySelector("#" + id);
    if (elem)
    {
      elem.style.display = "none";
    }
  }
}

export default Header_buddy;