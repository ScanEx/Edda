using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// Summary description for Order
/// </summary>
public class Order
{    
    public Guid OrderID { get; set; }
    [Exclude]
    public int Number { get; set; }
    public DateTime Date { get; set; }
    public string Surname { get; set; }
    public string Name { get; set; }
    public string Organization { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Comment { get; set; }
    public string ReceiveWay { get; set; }
    public string TinyReferenceID { get; set; }
    public string TinyReferenceUrl { get; set; }
    public int UserID { get; set; }
    public string Customer { get; set; }
    public string Project { get; set; }
    public string ProjectType { get; set; }
    public string ContractNumber { get; set; }
}


[AttributeUsage(AttributeTargets.Property, Inherited = false, AllowMultiple = false)]
public sealed class ExcludeAttribute : Attribute
{
    // See the attribute guidelines at 
    //  http://go.microsoft.com/fwlink/?LinkId=85236
    readonly string positionalString;

    public ExcludeAttribute()
    {

    }

    // This is a positional argument
    public ExcludeAttribute(string positionalString)
    {
        this.positionalString = positionalString;

        //// TODO: Implement code here
        //throw new NotImplementedException();
    }

    public string PositionalString
    {
        get { return positionalString; }
    }

    // This is a named argument
    public int NamedInt { get; set; }
}