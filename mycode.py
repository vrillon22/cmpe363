from flask import Flask, render_template, redirect, request
import random
import time
import pyodbc
import enchant
d=enchant.Dict("en_US")
server = 'tcp:cmpe363.database.windows.net'
database = 'cmpe363'
username = 'admin-room'
password = 'Cmpe363.'   
driver='{ODBC Driver 18 for SQL Server}'

conn = pyodbc.connect('DRIVER='+driver+';SERVER='+server+';DATABASE='+database+';UID='+username+';PWD='+password)

cursor = conn.cursor()

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/room', methods=['GET', 'POST'])
def room():
    if request.method == 'POST':
        roomID1=request.form['roomID']
        LL1=request.form['LL']
        W1=request.form['W'].lower()
        print(request.form)
        points10=cursor.execute("SELECT point FROM [dbo].[Room] WHERE roomID="+roomID1)        
        points1=points10.fetchall()[0][0]
        print(points1)

        
        US0=cursor.execute("SELECT usedWords FROM [dbo].[Room] WHERE roomID="+roomID1)
        US= US0.fetchall()[0][0]
        print(US)
        if W1=="..." :
            DT1="you didn't Say anything"
        elif W1[0]!=LL1:
            DT1="The word should start with :"
            points1-=10
        elif not d.check(W1):
            DT1="you can only use English words"
            points1-=10
        elif len(W1)==1:
            DT1="One letter doesn't count"
            points1-=10
        elif W1 in US.split(","):
            DT1="The word has already been used."
            points1-=10
        elif " " in W1:
            DT1="You had more than one word"
            points1-=10
        else :
            points1+=10
            LL1='abcdefghijklmnopqrstuvwxyz'[random.randint(0,25)]
            DT1="Say an English word which start with :"
            US+=","+str(W1)
            print(US)
        if US=="":
            mysqlcommand="UPDATE [dbo].[Room] SET point="+str(points1)+" WHERE roomID="+str(roomID1)
        else :
            mysqlcommand="UPDATE [dbo].[Room] SET point={} , usedWords='{}' WHERE roomID={}".format(points1,US,roomID1)
        print(mysqlcommand)
        c=cursor.execute(mysqlcommand)
        c.commit()
        points11=100-int(points1)
        if points1==0 or points11==0:
            return redirect("/")
        else:
            return render_template('cmpe363_project.html', roomID0=roomID1,points0=str(points1),points01=str(points11), LL0=LL1,DT0=DT1)
    else:
        
        insert_query = '''INSERT INTO [dbo].[Room] (roomID, point, usedWords)
                            VALUES (?, ?, ?);'''
        roomID1=int(time.time())
        points1=50
        points11=50
        used_words1=""
        values = (roomID1,points1,used_words1)
        cursor.execute(insert_query, values)
        conn.commit()
        LL1='abcdefghijklmnopqrstuvwxyz'[random.randint(0,25)]
        DT1="Say an English word which start with :"
        return render_template('cmpe363_project.html', roomID0=roomID1,points0=str(points1),points01=str(points11), LL0=LL1,DT0=DT1)