class InsertDefaultData < ActiveRecord::Migration[7.0]
  def change
    status = ['未着手', '進行中', '完了']
    priority_name = ['低', '中', '高']
    priority_id = [3, 2, 1]

    status.each do |s|
      Status.create(name: s)
    end


    priority_name.each_with_index do |p, i|
      Priority.create(name: p, priority: priority_id[i])
    end

  end
end
