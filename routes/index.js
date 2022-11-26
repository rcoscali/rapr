var express = require('express');
var router = express.Router();
const xml2js = require('xml2js');
const sqlite3 = require('sqlite3').verbose();
const fileUpload = require('express-fileupload');
var app = require('../app');
var db = require('../db');



function processGrpHdr(db, grpHdr) {
    grpHdr.forEach((element) => {
	var creationDateTime = element.CreDtTm[0].trim();
	var msgId = element.MsgId[0].trim();
	var lastPage = element.MsgPgntn[0].LastPgInd[0].trim() === 'true';
	var pageNb = element.MsgPgntn[0].PgNb[0].trim();
	console.log("    CreationDateTime = " + creationDateTime);
	console.log("    MsgId = " + msgId);
	console.log("    LastPage = " + lastPage);
	console.log("    PageNb = " + pageNb);
    });
}

function processStmt(db, stmt) {
    stmt.forEach((element) => {
	var currency = element.Acct[0].Ccy[0].trim();
	var iban = element.Acct[0].Id[0].IBAN[0].trim();
	var bic = element.Acct[0].Svcr[0].FinInstnId[0].BIC[0].trim();
	console.log("    currency = " + currency);
	console.log("    iban = " + iban);
	console.log("    bic = " + bic);
	var balIx = 0;
	for (balIx = 0; balIx < element.Bal.length; balIx++) {
	    var bal = element.Bal[balIx];
	    var ammount = bal.Amt[0]['_'].trim();
	    var currency = bal.Amt[0]['$'].Ccy;
	    var creditOrDebit = bal.CdtDbtInd[0].trim();
	    var date = bal.Dt[0].Dt[0].trim();
	    var type = bal.Tp[0].CdOrPrtry[0].Cd[0].trim();
	    console.log("    Balance["+balIx+"]");
	    console.log("        ammount = "+ammount);
	    console.log("        currency = "+currency);
	    console.log("        creditOrDebit = "+creditOrDebit);
	    console.log("        date = "+date);
	    console.log("        type = "+type);
	}
	var TxSumIx = 0;
	for (TxSumIx = 0; TxSumIx < element.TxsSummry.length; TxSumIx++) {
	    var TxsSummry = element.TxsSummry[TxSumIx];
	    var totalNbNtries = TxsSummry.TtlNtries[0].NbOfNtries[0].trim();
	    var totalNtriesSum = TxsSummry.TtlNtries[0].Sum[0].trim();
	    var totalNetNtriesAmt = 0;
	    if (typeof TxsSummry.TtlNtries[0].TtlNetNtryAmt !== 'undefined')
		totalNetNtriesAmt = TxsSummry.TtlNtries[0].TtlNetNtryAmt[0].trim();
	    var totalNetCreditDebit = 0;
	    if (typeof TxsSummry.TtlNtries[0].CdtDbtInd !== 'undefined')
		totalNetCreditDebit = TxsSummry.TtlNtries[0].CdtDbtInd[0].trim();
	    var totalCrdtNbEntries = TxsSummry.TtlCdtNtries[0].NbOfNtries[0].trim();
	    var totalCrdtEntriesSum = TxsSummry.TtlCdtNtries[0].Sum[0].trim();
	    var totalDbtNbEntries = TxsSummry.TtlDbtNtries[0].NbOfNtries[0].trim();
	    var totalDbtEntriesSum = TxsSummry.TtlDbtNtries[0].Sum[0].trim();
	    console.log("    Txs Summary["+TxSumIx+"]");
	    console.log("        totalNbNtries = "+totalNbNtries);
	    console.log("        totalNtriesSum = "+totalNtriesSum);
	    console.log("        totalNetNtriesAmt = "+totalNetNtriesAmt);
	    console.log("        totalNetCreditDebit = "+totalNetCreditDebit);
	    console.log("        totalCrdtNbEntries = "+totalCrdtNbEntries);
	    console.log("        totalCrdtEntriesSum = "+totalCrdtEntriesSum);
	    console.log("        totalDbtNbEntries = "+totalDbtNbEntries);
	    console.log("        totalDbtEntriesSum = "+totalDbtEntriesSum);
	}
	if (element.Ntry instanceof Array) {
	    var NtryIx = 0;
	    for (NtryIx = 0; NtryIx < element.Ntry.length; NtryIx++) {
		var entry = element.Ntry[NtryIx];
		var entryAmmount = entry.Amt[0]['_'].trim();
		var entryAmmountCurrency = entry.Amt[0]['$'].Ccy;
		var entryCreditDebit = entry.CdtDbtInd[0].trim();
		var entrySts = entry.Sts[0].trim();
		var entryBookingDate = entry.BookgDt[0].Dt[0].trim();
		var entryValueDate = entry.ValDt[0].Dt[0].trim();
		var entryTxCode = entry.BkTxCd[0].Domn[0].Fmly[0].Cd[0].trim();
		console.log("    Entry["+NtryIx+"]:");
		console.log("        entryAmmount = "+entryAmmount);
		console.log("        entryAmmountCurrency = "+entryAmmountCurrency);
		console.log("        entryCreditDebit = "+entryCreditDebit);
		console.log("        entrySts = "+entrySts);
		console.log("        entryBookingDate = "+entryBookingDate);
		console.log("        entryValueDate = "+entryValueDate);
		console.log("        entryTxCode = "+entryTxCode);
		if (entry.NtryDtls[0].TxDtls[0].RltdPties instanceof Array) {
		    var entryDebitor = entry.NtryDtls[0].TxDtls[0].RltdPties[0].Dbtr[0].Nm[0].trim();
		    var entryCreditor = '';
		    if (typeof entry.NtryDtls[0].TxDtls[0].RltdPties[0].Cdtr !== 'undefined')
			entryCreditor = entry.NtryDtls[0].TxDtls[0].RltdPties[0].Cdtr[0].Nm[0].trim();
		    console.log("        entryDebitor = "+entryDebitor);
		    console.log("        entryCreditor = "+entryCreditor);
		}
		var entryTxInfo = entry.NtryDtls[0].TxDtls[0].AddtlTxInf[0].trim();
		console.log("        entryTxInfo = "+entryTxInfo);
		if (entry.NtryDtls[0].TxDtls[0].RmtInf instanceof Array) {
		    var entryRmtInfo = entry.NtryDtls[0].TxDtls[0].RmtInf[0].Ustrd[0].trim();
		    console.log("        entryRmtInfo = "+entryRmtInfo);
		}
	    }
	}
    });
}

function processBkToCstmrStmt(db, bank2CstmrStmt) {
    bank2CstmrStmt.forEach((element) => {
	processGrpHdr(db, element['GrpHdr']);
	processStmt(db, element['Stmt']);
    });
}

// Instanciate keystore DB
var accountingdb =
    new sqlite3.Database(
        'c:/Users/a047461/AppData/Local/rapr/accounting.db',
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_FULLMUTEX | sqlite3.OPEN_PRIVATECACHE,
        (err) =>
        {
            if (err)
            {
                console.error(err.message);
                process.exit(1);
            }
            else {
                console.log('****** Accounting DB openned !');

                var app = express();
                app.locals.accountingDb = accountingdb;
                /* GET home page. */
                router.get(
                    '/',
	            (req, res, next) =>
                    {
	                res.render(
                            'index',
			    {
			        title: 'Rapprochements Bancaires',
			        content: 'Rapprochements Bancaires'
			    }
			);
	            }
	        );
                /* GET import_releve page. */
                router.get(
                    '/import_releve',
	            (req, res, next) =>
                    {
	                res.render(
                            'import_releve',
			    {
			        title: 'Importation Relevé Bancaire',
			        content: 'Sélectionner un fichier contenant le relevé bancaire'
			    }
			);
	            }
	        );
                /* POST upload_releve page */
                router.post(
                    '/upload_releve',
	            async (req, res, next) =>
                    {
			var releve, result;
		        try
                        {
		            if(!req.files)
                            {
			        res.send(
                                    {
			                status: false,
			                message: 'No file uploaded'
			            }
                                );
		            }
		            else {
			        releve = req.files.fichier_releve;
			        result = xml2js.parseStringPromise(releve.data).then((result) =>
                                    {
			                console.log('XML parsed!');
					var BankToCustomerStatements = result.Document['BkToCstmrStmt'];
					processBkToCstmrStmt(accountingdb, BankToCustomerStatements);
			                //send response
			                res.render(
					    'upload_releve',
					    {
						'content': 'file '+releve.name+' size '+releve.size
					    }
                                        );
			            }
                                ).catch(
                                    function (err)
                                    {
			                // Failed
			                res.send(
                                            {
				                status: false,
				                message: 'No file uploaded'
			                    });
			            });				
		            }
		        }
                        catch (err) {
		            res.status(500).send(err);
		        }
	            }
	        );
            }
        }
    );
module.exports = router;
