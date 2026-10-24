"""Trusted launcher: rlimits apply before exec of the restricted child."""
import os,resource,sys
cpu=int(sys.argv[1]); memory=int(sys.argv[2])
resource.setrlimit(resource.RLIMIT_CPU,(cpu,cpu+1))
resource.setrlimit(resource.RLIMIT_FSIZE,(32*1024*1024,32*1024*1024))
resource.setrlimit(resource.RLIMIT_NOFILE,(64,64))
resource.setrlimit(resource.RLIMIT_CORE,(0,0))
if sys.platform!='darwin':resource.setrlimit(resource.RLIMIT_AS,(memory,memory))
os.execv(sys.argv[3],sys.argv[3:])
