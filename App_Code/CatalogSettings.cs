using System.Configuration;

/// <summary>
/// Summary description for CatalogSettings
/// </summary>
public static class CatalogSettings
{
    public static void InitLayerSettings()
    {        
        CommonKosmosnimkiUtil.CommonUtilInit.InitGDAL(ConfigurationManager.AppSettings["FWTools"]);
    }
}
