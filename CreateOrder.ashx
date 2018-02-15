<%@ WebHandler Language="C#" Class="CreateOrder" Debug="true" %>

using System;
using System.Web;
using System.Web.Script.Serialization;
using CommonWebUtil;
using System.Net.Mail;
using System.Linq;
using System.Text;
using System.Threading;
using System.Collections.Generic;
using System.Net;
using System.Net.Mime;
using CommonKosmosnimkiUtil.oAuth;
using System.Configuration;
using System.Diagnostics;
using RequestParam = System.Collections.Generic.KeyValuePair<string, string>;
using System.Reflection;
using Npgsql;
using Newtonsoft;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class CreateOrder : IHttpHandler, System.Web.SessionState.IRequiresSessionState
{
    private static string SalesEmail = ConfigurationManager.AppSettings["SalesEmail"];
    private static readonly string SalesEmailNotification =
        string.Format(@"Если происходит задержка с ответом, пожалуйста, сообщите нам на {0}.", SalesEmail);

    private static readonly string SalesEmailNotificationEng =
        string.Format(@"If there are responce delay occures, please contact us at {0}.", SalesEmail);


    bool OrderExists(string tinyReference)
    {
        using (var con = new NpgsqlConnection(ConfigurationManager.ConnectionStrings["Catalog"].ConnectionString))
        {
            con.Open();
            using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM dbo.Order WHERE \"TinyReferenceUrl\" = @TinyReferenceUrl", con))
            {
                cmd.Parameters.AddWithValue("@TinyReferenceUrl", tinyReference);
                return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
            }
        }
    }

    static Order GetOrder(Guid orderID)
    {
        using (var con = new NpgsqlConnection(ConfigurationManager.ConnectionStrings["Catalog"].ConnectionString))
        {
            con.Open();
            using (var cmd = new NpgsqlCommand("SELECT * FROM dbo.Order WHERE \"OrderID\" = @OrderID", con))
            {
                cmd.Parameters.AddWithValue("@OrderID", orderID);

                var r = cmd.ExecuteReader();
                if (r.Read())
                {
                    var order = new Order
                    {
                        OrderID = r.GetGuid(r.GetOrdinal("OrderID")),
                        Number = r.GetInt32(r.GetOrdinal("Number")),
                        Date = r.GetDateTime(r.GetOrdinal("Date")),
                        TinyReferenceUrl = r.GetString(r.GetOrdinal("TinyReferenceUrl")),
                        Surname = r.GetString(r.GetOrdinal("Surname")),
                        Name = r.GetString(r.GetOrdinal("Name")),
                        Organization = r.GetString(r.GetOrdinal("Organization")),
                        Email = r.GetString(r.GetOrdinal("Email")),
                        Phone = r.GetString(r.GetOrdinal("Phone")),
                        Comment = r.GetString(r.GetOrdinal("Comment")),
                        ReceiveWay = r.GetString(r.GetOrdinal("ReceiveWay")),
                        Customer = r.GetString(r.GetOrdinal("Customer")),
                        Project = r.GetString(r.GetOrdinal("Project")),
                        ProjectType = r.GetString(r.GetOrdinal("ProjectType")),
                        ContractNumber = r.GetString(r.GetOrdinal("ContractNumber")),
                        UserID = r.GetInt32(r.GetOrdinal("userID")),
                    };
                    return order;
                }
                else
                {
                    return null;
                }

            }
        }
    }

    void Save(Order order)
    {
        using (var con = new NpgsqlConnection(ConfigurationManager.ConnectionStrings["Catalog"].ConnectionString))
        {
            con.Open();
            var properties = typeof(Order).GetProperties();
            var names = properties
                .Where(p => !p.GetCustomAttributes(typeof(ExcludeAttribute), false).Any())
                .Select(p => p.Name);
            var pgParams = properties.Select(p => new NpgsqlParameter(string.Format("@{0}", p.Name), (object)p.GetValue(order, null))).ToArray();
            using (var cmd = new NpgsqlCommand(
                string.Format("INSERT INTO dbo.Order ({0}) VALUES ({1})",
                String.Join(",", names.Select(k => string.Format("\"{0}\"", k))), String.Join(",", names.Select(k => string.Format("@{0}", k)))), con))
            {
                cmd.Parameters.AddRange(pgParams);
                cmd.ExecuteNonQuery();
            }
        }
    }

    public void ProcessRequest(HttpContext context)
    {
        HttpRequest req = context.Request;

        string tinyReference = req.GetValue("TinyReference");

        if (!String.IsNullOrEmpty(tinyReference))
        {
            HttpResponse resp = context.Response;

            if (OrderExists(tinyReference))
            {
                JsonResponse.WriteResultToResponse("Заказ уже был создан. Повторное создание заказа невозможно.", context);
                return;
            }
            else
            {
                Trace.TraceWarning(string.Format("UserName from Identity: {0}"), context.User.Identity.Name);
                int userID = int.Parse(context.User.Identity.Name);
                Guid orderID = Guid.NewGuid();                
                Save(new Order{
                    OrderID = orderID,
                    TinyReferenceUrl = tinyReference,
                    Surname = req.GetValue("Surname"),
                    Date = DateTime.Now,
                    Name = req.GetValue("Name"),
                    Organization = req.GetValue("Organization"),
                    Email = req.GetValue("Email"),
                    Phone = req.GetValue("Phone"),
                    Comment = req.GetValue("Comment"),
                    ReceiveWay = req.GetValue("ReceiveWay"),
                    Customer = req.GetValue("Customer"),
                    Project = req.GetValue("Project"),
                    ProjectType = req.GetValue("ProjectType"),
                    ContractNumber = req.GetValue("ContractNumber"),
                    UserID = userID
                });
                var order = GetOrder(orderID);                
                if (req.GetValue("Internal") == "true")
                {
                    this.SendLocalMail(order, req.GetValue("Scenes"));
                }
                else
                {
                    this.SendMail(order, req.GetValue("language"));
                }
                WebHelper.ClearResponse(resp);
                if (req.GetValue("language") == "eng")
                {
                    JsonResponse.WriteResultToResponse(this.GenerateOrderCreatedMessageEng(), context);
                }
                else
                {
                    JsonResponse.WriteResultToResponse(this.GenerateOrderCreatedMessage(), context);
                }
            }
        }
    }

    private string GenerateOrderCreatedMessage()
    {
        StringBuilder sb = new StringBuilder(@"Спасибо, Ваш заказ направлен в обработку.");
        sb.AppendLine(@"Вам отправлено письмо с постоянной ссылкой, по которой Ваш заказ сохранен в нашей базе заказов.");
        sb.AppendLine(@"Мы свяжемся с Вами и ответим более подробно о его стоимости и характеристиках.");
        sb.AppendLine(SalesEmailNotification);
        return sb.ToString();
    }

    private string GenerateOrderCreatedMessageEng()
    {
        StringBuilder sb = new StringBuilder(@"Thank you. Your order is being processed.");
        sb.AppendLine(@"An email with the permanent link to your query has been sent to your address.");
        sb.AppendLine(@"We will soon send you more information concerning the cost and details.");
        sb.AppendLine(SalesEmailNotificationEng);
        return sb.ToString();
    }

    private void SendMail(Order order, string language)
    {
        MailMessage mes = new MailMessage(SalesEmail, order.Email);
        string toEmails = ConfigurationManager.AppSettings["CopyEmails"];
        string[] eml = toEmails.Split(',');
        foreach (string s in eml) mes.Bcc.Add(s);

        //mes.Bcc.Add(SalesEmail);
        //mes.Bcc.Add(ShopEmail);
        if (language == "eng")
        {
            mes.Subject = string.Format(@"Order №{0} on kosmosnimki.ru", order.Number.ToString());
            mes.BodyEncoding = Encoding.GetEncoding("UTF-8");
            mes.Body = string.Join(Environment.NewLine, new[] {
                string.Format ("You have placed order {0}.{1}See details: {2}", order.OrderID, Environment.NewLine, order.TinyReferenceUrl),
                string.Format("Customer: {0}", order.Customer),
                string.Format("Name: {0}", order.Surname),
                string.Format("Email: {0}", order.Email),
                string.Format("Comment: {0}", order.Comment),
                SalesEmailNotificationEng
            });
        }
        else
        {
            mes.Subject = string.Format(@"Заказ № {0} на kosmosnimki.ru", order.Number.ToString());
            mes.BodyEncoding = Encoding.GetEncoding("UTF-8");

            mes.Body = string.Join(Environment.NewLine, new [] {
                string.Format ("Вы сделали заказ номер {0}.{1}Детали заказа: {2}", order.Number.ToString(), Environment.NewLine, order.TinyReferenceUrl),
                string.Format("Организация (заказчик): {0}", order.Customer),
                string.Format("Имя и фамилия: {0}", order.Surname),
                string.Format("Электронная почта: {0}", order.Email),
                string.Format("Комментарий: {0}", order.Comment),
                SalesEmailNotification
            });
        }
        SmtpClient sc = new SmtpClient(ConfigurationManager.AppSettings["SMTPServer"]);
        if (!string.IsNullOrEmpty(ConfigurationManager.AppSettings["EMailLogin"]))
        {
            sc.Credentials = new NetworkCredential(ConfigurationManager.AppSettings["EMailLogin"], ConfigurationManager.AppSettings["EMailPassword"]);
        }
        sc.Send(mes);
    }

    private void SendLocalMail(Order order, string scenes)
    {
        MailMessage mes = new MailMessage("no_reply@kosmosnimki.ru", "dp_order@scanex.ru");
        mes.CC.Add(order.Email);
        mes.CC.Add("sales@scanex.ru");
        mes.Subject = string.Format(@"Заказ № {0} на kosmosnimki.ru", order.Number.ToString());
        mes.BodyEncoding = Encoding.GetEncoding("UTF-8");
        scenes = string.Join(Environment.NewLine, scenes
            .Replace("\",\"", Environment.NewLine)
            .Replace("!1", String.Format(" ({0})", "10м мультиспектр"))
            .Replace("!2", String.Format(" ({0})", "5м панхром"))
            .Replace("!3", String.Format(" ({0})", "5м мультиспектр"))
            .Replace("!4", String.Format(" ({0})", "2.5м панхром"))
            .Replace("!5", String.Format(" ({0})", "2.5м мультиспектр"))
            .Split(','));
        mes.Body = string.Join(Environment.NewLine, new[] {
            string.Format("Организация (заказчик): {0}", order.Customer),
            string.Format("Название проекта: {0}", order.Project),
            string.Format("Тип проекта: {0}", order.ProjectType),
            string.Format("Номер договора-контракта: {0}", order.ContractNumber),
            string.Format("Исполнитель: {0}", order.Surname),
            string.Format("Электронная почта: {0}", order.Email),
            string.Format("Комментарий: {0}", order.Comment),
            string.Format("Список сцен:{0}{1}", Environment.NewLine, scenes),
            string.Format("Подробности о заказе: {0}", order.TinyReferenceUrl),
        });

        SmtpClient sc = new SmtpClient(ConfigurationManager.AppSettings["SMTPServer"]);
        if (!string.IsNullOrEmpty(ConfigurationManager.AppSettings["EMailLogin"]))
            sc.Credentials = new NetworkCredential(ConfigurationManager.AppSettings["EMailLogin"], ConfigurationManager.AppSettings["EMailPassword"]);
        sc.Send(mes);
    }

    public bool IsReusable
    {
        get { return false; }
    }
}