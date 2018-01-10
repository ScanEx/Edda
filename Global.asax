<%@ Application Language="C#" %>
<%@ Import Namespace="CommonKosmosnimkiUtil" %>

<script RunAt="server">    

    //void Application_Start(object sender, EventArgs e) {
    //    CatalogSettings.InitLayerSettings();        
    //}

    void Application_PostAuthorizeRequest(object sender, EventArgs args)
    {
        try
        {
            var auth = new CommonKosmosnimkiUtil.oAuth.AuthorizationFlow();
            if (
                auth.AcceptBearer() || 	// Токен в хедере Authorization
                auth.AcceptTokenParam() || // Токен в параметре запроса
                auth.AcceptTicket() || 	// Авторизационные данные в куке
                auth.AuthorizeSession()	// Авторизационные данные храняться на сервере
            )
            {
                HttpContext.Current.User = new System.Security.Principal.GenericPrincipal(
                            new System.Web.Security.FormsIdentity(
                                new System.Web.Security.FormsAuthenticationTicket(auth.Owner.ID.ToString(), false, (int)((DateTime)auth.Owner.TokenExpires - DateTime.Now).TotalMinutes)),
                                new string[] { auth.Owner.Role });
                System.Threading.Thread.CurrentPrincipal = HttpContext.Current.User;                               
            }
        }
        catch (Exception)
        {
        }
    } 

</script>
